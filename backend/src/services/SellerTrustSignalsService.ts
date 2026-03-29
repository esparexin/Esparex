import mongoose from 'mongoose';
import logger from '../utils/logger';

const logDeprecatedSignal = (signal: string, userIdInput: string | mongoose.Types.ObjectId): void => {
    logger.debug('Deprecated seller reputation signal ignored', {
        signal,
        userId: String(userIdInput ?? '')
    });
};

export const recordSellerAdPosted = async (
    userIdInput: string | mongoose.Types.ObjectId
): Promise<void> => {
    logDeprecatedSignal('recordSellerAdPosted', userIdInput);
};
