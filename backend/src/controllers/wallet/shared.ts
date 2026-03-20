import UserWallet from '../../models/UserWallet';
import Transaction from '../../models/Transaction';

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';

export const WalletModel = UserWallet as unknown as {
    findOne: (query: Record<string, unknown>) => {
        lean: () => Promise<Record<string, unknown> | null>;
    };
    create: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
    findOneAndUpdate: (
        query: Record<string, unknown>,
        update: Record<string, unknown>,
        options: { upsert: boolean; new: boolean }
    ) => Promise<Record<string, unknown> | null>;
};

export const TransactionModel = Transaction as unknown as {
    find: (query: Record<string, unknown>) => {
        sort: (sortBy: Record<string, 1 | -1>) => {
            limit: (limit: number) => {
                skip: (skip: number) => {
                    lean: () => Promise<Record<string, unknown>[]>;
                };
            };
        };
    };
    countDocuments: (query: Record<string, unknown>) => Promise<number>;
};
