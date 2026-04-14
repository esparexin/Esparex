describe('Populate governance guard', () => {
    const originalMongoUri = process.env.MONGODB_URI;
    const originalAdminMongoUri = process.env.ADMIN_MONGODB_URI;
    const originalAllowDbConnect = process.env.ALLOW_DB_CONNECT;

    beforeEach(() => {
        jest.resetModules();
        delete (global as typeof globalThis & { mongooseUserCache?: unknown }).mongooseUserCache;
        delete (global as typeof globalThis & { mongooseAdminCache?: unknown }).mongooseAdminCache;
        process.env.NODE_ENV = 'test';
        process.env.ALLOW_DB_CONNECT = 'false';
        process.env.MONGODB_URI = 'mongodb://localhost:27017/esparex_user';
        process.env.ADMIN_MONGODB_URI = 'mongodb://localhost:27017/esparex_admin';
    });

    afterEach(() => {
        if (originalMongoUri === undefined) {
            delete process.env.MONGODB_URI;
        } else {
            process.env.MONGODB_URI = originalMongoUri;
        }

        if (originalAdminMongoUri === undefined) {
            delete process.env.ADMIN_MONGODB_URI;
        } else {
            process.env.ADMIN_MONGODB_URI = originalAdminMongoUri;
        }

        if (originalAllowDbConnect === undefined) {
            delete process.env.ALLOW_DB_CONNECT;
        } else {
            process.env.ALLOW_DB_CONNECT = originalAllowDbConnect;
        }
    });

    it('blocks split-db populates for admin-owned refs unless the caller provides an explicit model', async () => {
        await jest.isolateModulesAsync(async () => {
            await import('../../models/registry');
            const { default: Ad } = await import('../../models/Ad');
            const { default: SparePart } = await import('../../models/SparePart');
            const { default: ServiceType } = await import('../../models/ServiceType');

            expect(() => Ad.find().populate({ path: 'sparePartId', select: 'name slug' })).toThrow(
                '[PopulateGovernance] Unsafe populate("sparePartId")'
            );

            expect(() => Ad.find().populate({ path: 'serviceTypeIds', select: 'name slug' })).toThrow(
                '[PopulateGovernance] Unsafe populate("serviceTypeIds")'
            );

            expect(() =>
                Ad.find().populate({ path: 'sparePartId', model: SparePart, select: 'name slug' })
            ).not.toThrow();

            expect(() =>
                Ad.find().populate({ path: 'serviceTypeIds', model: ServiceType, select: 'name slug' })
            ).not.toThrow();
        });
    });
});
