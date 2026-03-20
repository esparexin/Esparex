import { connectDB } from '../src/config/db';
import { AD_STATUS } from '../../shared/enums/adStatus';
import { BUSINESS_STATUS } from '../../shared/enums/businessStatus';
import { SERVICE_STATUS } from '../../shared/enums/serviceStatus';
import { USER_STATUS } from '../../shared/enums/userStatus';
import { CATALOG_STATUS } from '../../shared/enums/catalogStatus';
import { PAYMENT_STATUS } from '../../shared/enums/paymentStatus';
import { CONVERSATION_STATUS } from '../../shared/enums/conversationStatus';
import { REPORT_STATUS } from '../../shared/enums/reportStatus';

// Import models with aliases
import AdModel from '../src/models/Ad';
import BusinessModel from '../src/models/Business';
import ServiceModel from '../src/models/Service';
import UserModel from '../src/models/User';
import ReportModel from '../src/models/Report';
import InvoiceModel from '../src/models/Invoice';
import TransactionModel from '../src/models/Transaction';
import ConversationModel from '../src/models/Conversation';
import BrandModel from '../src/models/Brand';
import CatalogModel from '../src/models/Model';
import CategoryModel from '../src/models/Category';

async function audit() {
    console.log('--- Connecting to Databases ---');
    await connectDB();
    console.log('--- Starting Canonical Enum Audit ---');

    const collections = [
        { model: AdModel as any, name: 'Ads', canonicalValues: Object.values(AD_STATUS) },
        { model: BusinessModel as any, name: 'Businesses', canonicalValues: Object.values(BUSINESS_STATUS) },
        { model: ServiceModel as any, name: 'Services', canonicalValues: Object.values(SERVICE_STATUS) },
        { model: UserModel as any, name: 'Users', canonicalValues: Object.values(USER_STATUS) },
        { model: ReportModel as any, name: 'Reports', canonicalValues: Object.values(REPORT_STATUS) },
        { model: InvoiceModel as any, name: 'Invoices', canonicalValues: Object.values(PAYMENT_STATUS) },
        { model: TransactionModel as any, name: 'Transactions', canonicalValues: Object.values(PAYMENT_STATUS) },
        { model: ConversationModel as any, name: 'Conversations', canonicalValues: Object.values(CONVERSATION_STATUS) },
        { model: BrandModel as any, name: 'Brands', canonicalValues: Object.values(CATALOG_STATUS) },
        { model: CatalogModel as any, name: 'Models', canonicalValues: Object.values(CATALOG_STATUS) },
        { model: CategoryModel as any, name: 'Categories', canonicalValues: Object.values(CATALOG_STATUS) },
    ];

    for (const col of collections) {
        try {
            const total = await col.model.countDocuments({});
            const nonCanonical = await col.model.countDocuments({
                status: { $nin: col.canonicalValues }
            });

            console.log(`${col.name.padEnd(15)}: Total: ${total.toString().padStart(6)} | Non-Canonical: ${nonCanonical.toString().padStart(4)}`);
            
            if (nonCanonical > 0) {
                const sample = await col.model.distinct('status', { status: { $nin: col.canonicalValues } });
                console.log(`  -> Legacy values found: ${JSON.stringify(sample)}`);
            }
        } catch (err: any) {
            console.error(`Error auditing ${col.name}: ${err.message}`);
        }
    }

    console.log('--- Audit Complete ---');
    process.exit(0);
}

audit().catch(err => {
    console.error(err);
    process.exit(1);
});
