import mongoose from 'mongoose';

export default async (): Promise<void> => {
    const logTeardownWarning = (message: string, error: unknown): void => {
        if (process.env.JEST_VERBOSE_TEARDOWN !== 'true') return;
        const detail = error instanceof Error ? error.message : String(error);
        process.stderr.write(`[jest-teardown] ${message}: ${detail}\n`);
    };

    try {
        const openConnections = Array.isArray(mongoose.connections)
            ? mongoose.connections.filter((conn) => conn && conn.readyState !== 0)
            : [];

        await Promise.all(
            openConnections.map(async (conn) => {
                try {
                    await conn.close(true);
                } catch (error) {
                    logTeardownWarning('Failed to close mongoose connection in global teardown', error);
                }
            })
        );
    } catch (error) {
        logTeardownWarning('Global teardown cleanup failed', error);
    }
};
