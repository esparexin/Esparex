import { ScreenSizeBulkDeleteCriteria, ScreenSizeRepositoryPort } from '../../../../domains/catalog';
import ScreenSizeMongoose from '../../../../models/ScreenSize';

export class MongoScreenSizeRepositoryAdapter implements ScreenSizeRepositoryPort {
    async softDeleteByCriteria(criteria: ScreenSizeBulkDeleteCriteria, tx?: unknown): Promise<number> {
        const { categoryId, brandIds } = criteria;
        const update = { isDeleted: true, isActive: false, deletedAt: new Date() };

        const orFilters: Array<Record<string, unknown>> = [{ categoryId }];
        if (brandIds && brandIds.length > 0) {
            orFilters.push({ brandId: { $in: brandIds } });
        }

        const query = ScreenSizeMongoose.updateMany(
            { $or: orFilters },
            { $set: update }
        );
        if (tx) query.session(tx as any);
        const res = await query.exec();
        return res.modifiedCount;
    }
}
