import mongoose from 'mongoose';
import { getAdminConnection, connectDB } from '../../config/db';
import Brand from '../../models/Brand';
import ProductModel from '../../models/Model';
import ServiceType from '../../models/ServiceType';
import SparePart from '../../models/SparePart';
import logger from '../../utils/logger';

/**
 * repairLegacyCatalogRelations
 * 
 * Synchronizes legacy singular categoryId to plural categoryIds[] for
 * ServiceType, Brand, Model, and SparePart collections to ensure strict validation compatibility.
 */
async function repairLegacyCatalogRelations() {
    try {
        await connectDB();
        const db = getAdminConnection();
        logger.info('Starting Catalog Relation Repair (Singular -> Plural categoryIds)...');

        const collections = [
            { name: 'ServiceType', model: ServiceType },
            { name: 'Brand', model: Brand },
            { name: 'Model', model: ProductModel },
            { name: 'SparePart', model: SparePart }
        ];

        for (const col of collections) {
            logger.info(`Auditing ${col.name} collection...`);
            const model = col.model as any;
            
            // Find docs where categoryIds is empty or missing, but categoryId exists
            const legacyDocs = await model.find({
                $or: [
                    { categoryIds: { $exists: false } },
                    { categoryIds: { $size: 0 } },
                    { categoryIds: null }
                ],
                categoryId: { $exists: true, $ne: null }
            }).lean();

            logger.info(`Found ${legacyDocs.length} legacy ${col.name} documents to repair.`);

            let count = 0;
            for (const doc of legacyDocs) {
                const categoryId = (doc as any).categoryId;
                if (!categoryId) continue;

                await model.updateOne(
                    { _id: doc._id },
                    { 
                        $set: { categoryIds: [categoryId] } 
                    }
                );
                count++;
            }
            logger.info(`Successfully repaired ${count} ${col.name} documents.`);
        }

        logger.info('Catalog Relation Repair Completed.');

    } catch (error) {
        logger.error('Repair Script Failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Execute if run directly
if (require.main === module) {
    repairLegacyCatalogRelations();
}

export default repairLegacyCatalogRelations;
