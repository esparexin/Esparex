"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogCategorizationAuditCommand = void 0;
const commandUtils_1 = require("./commandUtils");
/**
 * 📋 Catalog Categorization Audit
 */
exports.catalogCategorizationAuditCommand = {
    name: 'catalog-categorization-audit',
    description: 'Diagnoses inconsistencies in Model-Category assignments',
    blastRadius: 'low',
    run: async () => {
        const db = await (0, commandUtils_1.connectOpsDb)();
        const models = db.collection('models');
        const categories = db.collection('categories');
        const allModels = await models.find({ isDeleted: { $ne: true } }).toArray();
        const allCategories = await categories.find({ isActive: true }).toArray();
        const categoryIds = new Set(allCategories.map(c => c._id.toString()));
        const issues = {
            missingCategory: [],
            invalidCategory: [],
        };
        for (const model of allModels) {
            if (!model.categoryId) {
                issues.missingCategory.push(`${model.name} (${String(model._id)})`);
                continue;
            }
            if (!categoryIds.has(String(model.categoryId))) {
                issues.invalidCategory.push(`${model.name} (${String(model._id)}) -> Cat: ${String(model.categoryId)}`);
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
//# sourceMappingURL=catalogCategorizationAudit.command.js.map