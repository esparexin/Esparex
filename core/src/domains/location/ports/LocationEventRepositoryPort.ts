export interface LocationEventRepositoryPort {
    createLocationEvent(payload: Record<string, unknown>): Promise<any>;
}
