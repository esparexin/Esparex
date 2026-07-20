import mongoose from 'mongoose';
import { getUserConnection } from '../../../config/db';
import logger from '../../../utils/logger';

export class MongoUnitOfWorkBase {
    async executeTransaction<T>(work: (context: unknown) => Promise<T>): Promise<T> {
        let session: mongoose.ClientSession | null = null;
        try {
            session = await getUserConnection().startSession();
            if (session) {
                session.startTransaction();
                const result = await work(session);
                await session.commitTransaction();
                return result;
            }
            return await work(null);
        } catch (e: unknown) {
            if (session) {
                try { await session.abortTransaction(); } catch { /* ignore */ }

                const errorMessage = e instanceof Error ? e.message : String(e);
                const isSessionError = /session|transaction|mongoclient/i.test(errorMessage);

                if (isSessionError) {
                    logger.warn(`Transaction session failed (${errorMessage}). Retrying sequential sessionless...`);
                    try { await session.endSession(); } catch { /* ignore */ }
                    session = null;
                    return await work(null);
                }
            }
            throw e;
        } finally {
            if (session) {
                try { await session.endSession(); } catch { /* ignore */ }
            }
        }
    }
}
