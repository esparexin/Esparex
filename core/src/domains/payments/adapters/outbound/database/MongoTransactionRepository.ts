import { TransactionRepositoryPort } from '../../../ports/TransactionRepositoryPort';
import Transaction from '../../../../../models/Transaction';
import type { ClientSession } from 'mongoose';

export class MongoTransactionRepository implements TransactionRepositoryPort {
    async findById(id: string, session?: unknown): Promise<any | null> {
        const query = Transaction.findById(id);
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async findByGatewayPaymentId(paymentId: string, session?: unknown): Promise<any | null> {
        const query = Transaction.findOne({ paymentGateway: paymentId }); // Assuming paymentGateway stores the ID for now
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async save(transaction: any, session?: unknown): Promise<any> {
        if (!transaction._id) {
            const newTransaction = new Transaction(transaction);
            return newTransaction.save({ session: session as ClientSession });
        }
        
        return Transaction.findByIdAndUpdate(transaction._id, transaction, { 
            new: true, 
            session: session as ClientSession 
        }).exec();
    }

    async updateStatus(id: string, status: string, session?: unknown): Promise<any> {
        return Transaction.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true, session: session as ClientSession }
        ).exec();
    }
}
