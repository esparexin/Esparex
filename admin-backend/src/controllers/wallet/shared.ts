export { WalletModel, TransactionModel } from '@core/services/WalletService';

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';
