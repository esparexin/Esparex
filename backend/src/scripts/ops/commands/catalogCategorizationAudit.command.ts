import { connectOpsDb } from './commandUtils';
import { OpsCommand, OpsCommandResult } from '../types';

/**
 * 📋 Catalog Categorization Audit
 */
export const catalogCategorizationAuditCommand: OpsCommand = {
    name: 'catalog-categorization-audit',
    description: 'Diagnoses inconsistencies in Model-Category assignments',
    blastRadius: 'low',
    run: async (): Promise<OpsCommandResult> => {
        const db = await connectOpsDb();
        const models = db.collection('models');
        const categories = db.collection('categories');

        const allModels = await models.find({ isDeleted: { $ne: true } }).toArray();
        const allCategories = await categories.find({ isActive: true }).toArray();
        const categoryIds = new Set(allCategories.map(c => c._id.toString()));

        const issues = {
            missingCategory: [] as string[],
            invalidCategory: [] as string[],
        };

        for (const model of allModels) {
            if (!model.categoryId) {
                issues.missingCategory.push(`${model.name} (${model._id})`);
                continue;
            }

            if (!categoryIds.has(model.categoryId.toString())) {
                issues.invalidCategory.push(`${model.name} (${model._id}) -> Cat: ${model.categoryId}`);
            }
        }

        return {
            summary: {
                totalModelsSearched: allModels.length,
                missingCategoryCount: issues.missingCategory.length,
                invalidCategoryCount: issues.invalidCategory.length,
                issues
            }
        };
    }
};
