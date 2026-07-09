const mockSession = {
    withTransaction: jest.fn().mockImplementation(async (cb) => {
        await cb();
    }),
    endSession: jest.fn(),
};

const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
};

export const getUserConnection = jest.fn().mockReturnValue(mockConnection);
export const getAdminConnection = jest.fn().mockReturnValue(mockConnection);
export const connectDB = jest.fn().mockResolvedValue(undefined);
export const closeDB = jest.fn().mockResolvedValue(undefined);
export const isDbReady = jest.fn().mockReturnValue(true);
export const getDatabaseHealthProbe = jest.fn().mockResolvedValue({
    overall: 'up',
    user: { status: 'up', readyState: 1, stateLabel: 'connected', pingOk: true, latencyMs: 5 },
    admin: { status: 'up', readyState: 1, stateLabel: 'connected', pingOk: true, latencyMs: 5 }
});
