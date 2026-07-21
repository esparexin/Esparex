export interface UnitOfWorkPort {
    /**
     * Begins a new transaction
     */
    begin(): Promise<void>;

    /**
     * Commits the current transaction
     */
    commit(): Promise<void>;

    /**
     * Rolls back the current transaction
     */
    rollback(): Promise<void>;

    /**
     * Ends the transaction session
     */
    end(): Promise<void>;

    /**
     * Returns the underlying session token to pass to repositories
     * Type is 'unknown' to prevent infrastructure leakage into the domain
     */
    getSession(): unknown;
}
