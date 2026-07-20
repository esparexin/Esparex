import { InvoiceRepositoryPort } from '../../../ports/InvoiceRepositoryPort';
import Invoice from '../../../../../models/Invoice';
import type { ClientSession } from 'mongoose';

export class MongoInvoiceRepository implements InvoiceRepositoryPort {
    async findById(id: string, session?: unknown): Promise<any | null> {
        const query = Invoice.findById(id);
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async findByTransactionId(transactionId: string, session?: unknown): Promise<any | null> {
        const query = Invoice.findOne({ transactionId });
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async save(invoice: any, session?: unknown): Promise<any> {
        if (!invoice._id) {
            const newInvoice = new Invoice(invoice);
            return newInvoice.save({ session: session as ClientSession });
        }
        
        return Invoice.findByIdAndUpdate(invoice._id, invoice, { 
            new: true, 
            session: session as ClientSession 
        }).exec();
    }
}
