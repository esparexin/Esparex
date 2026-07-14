export type TransactionContext = unknown;

export interface CatalogUnitOfWorkPort {
    /**
     * Executes the given work block atomically.
     * If the block throws, the transaction is rolled back.
     * 
     * @param work Function to execute within the transaction context
     * @returns The result of the work block
     */
    executeTransaction<T>(work: (context: TransactionContext) => Promise<T>): Promise<T>;
}
