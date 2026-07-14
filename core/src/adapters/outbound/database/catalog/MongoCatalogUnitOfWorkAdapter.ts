import mongoose from 'mongoose';
import { CatalogUnitOfWorkPort, TransactionContext } from '../../../../domains/catalog/ports/CatalogUnitOfWorkPort';
import { getUserConnection } from '../../../../config/db';
import logger from '../../../../utils/logger';

export class MongoCatalogUnitOfWorkAdapter implements CatalogUnitOfWorkPort {
    async executeTransaction<T>(work: (context: TransactionContext) => Promise<T>): Promise<T> {
        let session: mongoose.ClientSession | null = null;
        try {
            session = await getUserConnection().startSession();
            if (session) {
                session.startTransaction();
                const result = await work(session);
                await session.commitTransaction();
                return result;
            }
            // Fallback if session creation fails (e.g., non-replica set local db)
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
