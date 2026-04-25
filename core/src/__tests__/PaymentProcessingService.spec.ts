import { processSuccessfulPayment } from '@core/services/PaymentProcessingService';
import { Transaction } from '../models/Transaction';
import AdminLog from '../models/AdminLog';
import { getUserConnection } from '../config/db';
import * as WalletService from '@core/services/WalletService';
import * as InvoiceService from '@core/services/InvoiceService';
import * as GatewayService from '@core/services/GatewayService';

jest.mock('../models/Transaction', () => ({
    Transaction: {
        findOneAndUpdate: jest.fn(),
        findOne: jest.fn(),
        updateOne: jest.fn()
    }
}));
jest.mock('../models/AdminLog', () => ({
    __esModule: true,
    default: {
        create: jest.fn().mockResolvedValue({})
    }
}));
jest.mock('../models/Invoice', () => ({
    Invoice: {
        findOne: jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue(null)
        }),
        create: jest.fn().mockResolvedValue([{ _id: 'invoice-1' }])
    }
}));
jest.mock('../config/db', () => ({
    getUserConnection: jest.fn().mockReturnValue({
        models: {},
        model: jest.fn(),
        startSession: jest.fn()
    }),
    getAdminConnection: jest.fn().mockReturnValue({
        models: {},
        model: jest.fn()
    })
}));
jest.mock('../services/WalletService');
jest.mock('../services/InvoiceService');
jest.mock('../services/GatewayService');

describe('PaymentProcessingService', () => {
    let mockSession: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        };

        (getUserConnection as jest.Mock).mockReturnValue({
            startSession: jest.fn().mockResolvedValue(mockSession)
        });

        // Default valid match
        (GatewayService.matchesGatewayAmount as jest.Mock).mockReturnValue(true);
        (GatewayService.normalizeGatewayCurrency as jest.Mock).mockImplementation(val => val?.toUpperCase() || 'INR');
        (WalletService.buildWalletIncrement as jest.Mock).mockReturnValue(100);
        (WalletService.hasWalletIncrement as jest.Mock).mockReturnValue(true);
        (WalletService.credit as jest.Mock).mockResolvedValue(true);
        
        (InvoiceService.buildInvoicePayload as jest.Mock).mockResolvedValue({ invoiceData: { _id: 'invoice-1' } });
        (InvoiceService.ensureInvoicePdf as jest.Mock).mockResolvedValue(true);
    });

    describe('AdminLog Integrations', () => {
        it('should create an AdminLog when payment is verified successfully', async () => {
            const mockTx = {
                _id: 'tx-123',
                amount: 100,
                currency: 'INR',
                userId: 'user-1',
                applied: false,
                save: jest.fn().mockResolvedValue(true)
            };

            (Transaction.findOneAndUpdate as jest.Mock).mockReturnValue(mockTx);
            
            // To ensure we bypass the internal Invoice model findOne without crashing if it wasn't mocked properly above
            // We just let the mock session run.
            
            const result = await processSuccessfulPayment({
                gatewayPaymentId: 'pay_xyz',
                source: 'webhook',
                gatewayAmountPaise: 10000,
                gatewayCurrency: 'INR'
            });

            expect(result.result).toBe('processed');
            expect(result.transactionId).toBe('tx-123');

            expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
                action: 'PAYMENT_VERIFIED',
                targetType: 'Transaction',
                targetId: 'tx-123',
                metadata: expect.objectContaining({
                    gatewayPaymentId: 'pay_xyz',
                    source: 'webhook'
                })
            }));
        });

        it('should log to AdminLog when payment fails due to amount mismatch', async () => {
            const mockTx = {
                _id: 'tx-123',
                amount: 100, // 100 INR = 10000 Paise
                currency: 'INR',
                status: 'INITIATED',
                userId: 'user-1',
                applied: false,
                metadata: {},
                save: jest.fn().mockResolvedValue(true)
            };

            (Transaction.findOneAndUpdate as jest.Mock).mockReturnValue(mockTx);
            (GatewayService.matchesGatewayAmount as jest.Mock).mockReturnValue(false); // Force mismatch
            
            const result = await processSuccessfulPayment({
                gatewayPaymentId: 'pay_xyz',
                source: 'webhook',
                gatewayAmountPaise: 5000, // Only 50 INR received!
                gatewayCurrency: 'INR'
            });

            expect(result.result).toBe('failed');
            expect(result.reason).toBe('amount_mismatch');
            expect(mockTx.status).toBe('FAILED');

            expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
                action: 'PAYMENT_FAILED_AMOUNT_MISMATCH',
                targetType: 'Transaction',
                targetId: 'tx-123',
                metadata: expect.objectContaining({
                    gatewayAmountPaise: 5000,
                    expectedAmountPaise: 10000
                })
            }));
        });
    });

    describe('Idempotency logic', () => {
        it('should return duplicate without logging an AdminLog if already applied', async () => {
            (Transaction.findOneAndUpdate as jest.Mock).mockReturnValue(null);
            
            // Simulating findOne returning an applied transaction
            (Transaction.findOne as jest.Mock).mockReturnValue({
                session: jest.fn().mockResolvedValue({
                    _id: 'tx-dup',
                    applied: true,
                    status: 'SUCCESS'
                })
            });

            const result = await processSuccessfulPayment({
                gatewayPaymentId: 'pay_dup',
                source: 'webhook',
                gatewayAmountPaise: 10000,
                gatewayCurrency: 'INR'
            });

            expect(result.result).toBe('duplicate');
            expect(result.transactionId).toBe('tx-dup');

            expect(mockSession.abortTransaction).toHaveBeenCalled();
            expect(AdminLog.create).not.toHaveBeenCalled();
            expect(WalletService.credit).not.toHaveBeenCalled();
        });
    });
});
