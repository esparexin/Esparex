import { WalletRepositoryPort } from '../../../ports/WalletRepositoryPort';
import UserWallet from '../../../../../models/UserWallet';
import type { ClientSession } from 'mongoose';

export class MongoWalletRepository implements WalletRepositoryPort {
    async findByUserId(userId: string, session?: unknown): Promise<any | null> {
        const query = UserWallet.findOne({ userId });
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async incrementBalance(userId: string, amount: number, session?: unknown): Promise<any> {
        return UserWallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: amount } },
            { new: true, upsert: true, session: session as ClientSession }
        ).exec();
    }

    async decrementBalance(userId: string, amount: number, session?: unknown): Promise<any> {
        return UserWallet.findOneAndUpdate(
            { userId },
            { $inc: { balance: -amount } },
            { new: true, session: session as ClientSession }
        ).exec();
    }

    async save(wallet: any, session?: unknown): Promise<any> {
        if (!wallet._id) {
            const newWallet = new UserWallet(wallet);
            return newWallet.save({ session: session as ClientSession });
        }
        
        return UserWallet.findByIdAndUpdate(wallet._id, wallet, { 
            new: true, 
            session: session as ClientSession 
        }).exec();
    }
}
