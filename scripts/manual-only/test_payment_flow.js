const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

if (process.env.ALLOW_MANUAL_SCRIPT !== 'true') {
    console.error('Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/test_payment_flow.js');
    process.exit(1);
}

dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const API_URL = 'http://localhost:5000/api/v1';

async function runTest() {
    try {
        console.log('🔌 Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Get User
        // Use require. If export default, access .default
        const UserModule = require('../../backend/src/models/User');
        const User = UserModule.default || UserModule;

        let user = await User.findOne({ email: 'test_payment@example.com' });
        if (!user) {
            user = await User.create({
                name: 'Test Payment User',
                email: 'test_payment@example.com',
                mobile: '9999999999',
                role: 'user',
                status: 'active',
                isVerified: true
            });
            console.log('👤 Created Test User');
        } else {
            console.log('👤 Found Test User');
        }

        // 2. Generate Token
        // Role is vital
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        console.log('🔑 Generated Token');

        // 3. Get Plan
        const PlanModule = require('../../backend/src/models/Plan');
        const Plan = PlanModule.default || PlanModule;

        const plan = await Plan.findOne({ active: true });
        if (!plan) throw new Error('No active plan found');
        console.log(`📦 Found Plan: ${plan.name} (${plan.price})`);

        // 4. Create Order (Mock)
        console.log('🛒 Creating Payment Order...');
        const orderRes = await fetch(`${API_URL}/payments/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-mock-payment': 'true'
            },
            body: JSON.stringify({ planId: plan._id })
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(`Order Failed: ${JSON.stringify(orderData)}`);

        console.log('✅ Order Created:', orderData.data.orderId);
        const orderId = orderData.data.orderId;
        const transactionId = orderData.data.transactionId;

        if (!orderId.startsWith('order_mock_')) {
            console.warn('⚠️ Order ID does not look like a mock! Is backend running with changes?');
        }

        // 5. Trigger Webhook
        console.log('📡 Triggering Mock Webhook...');
        const webhookPayload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: `pay_mock_${Date.now()}`,
                        order_id: orderId,
                        status: 'captured',
                        amount: plan.price * 100
                    }
                }
            }
        };

        const webhookRes = await fetch(`${API_URL}/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': 'mock_verif_bypass'
            },
            body: JSON.stringify(webhookPayload)
        });

        const webhookData = await webhookRes.json();
        if (!webhookRes.ok) throw new Error(`Webhook Failed: ${JSON.stringify(webhookData)}`);
        console.log('✅ Webhook Processed:', webhookData);

        // 6. Verify Transaction Status
        const TransactionModule = require('../backend/src/models/Transaction');
        const Transaction = TransactionModule.default || TransactionModule;

        const tx = await Transaction.findById(transactionId);
        if (tx && tx.status === 'SUCCESS' && tx.applied) {
            console.log('🎉 Transaction Verified: SUCCESS & APPLIED');
        } else {
            console.error('❌ Transaction Verification Failed:', tx);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
