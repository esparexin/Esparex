export { WalletModel, TransactionModel } from '@esparex/core/services';;

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'Unexpected error';
