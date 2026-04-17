afterAll(async () => {
    const mongooseModule = await import('mongoose');
    const mongoose = mongooseModule.default;

    const openConnections = Array.isArray(mongoose.connections)
        ? mongoose.connections.filter((conn) => conn && conn.readyState !== 0)
        : [];

    await Promise.all(
        openConnections.map(async (conn) => {
            try {
                await conn.close(true);
            } catch {
                // Global teardown still runs as a final safety net.
            }
        })
    );

    try {
        const redisModule = await import('../config/redis');
        if (redisModule && redisModule.default && redisModule.default.quit) {
            await redisModule.default.quit();
        }
    } catch {
        // Safe fail
    }
});
