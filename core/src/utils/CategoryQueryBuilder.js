"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryQueryBuilder = exports.CategoryFieldType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * CategoryQueryBuilder
 *
 * SSOT for constructing MongoDB category filters across different catalog entities.
 * Ensures strict type handling and prevents "logical drift" during query construction.
 */
var CategoryFieldType;
(function (CategoryFieldType) {
    /** Entity uses singular field 'categoryId' (e.g., Ad, ScreenSize) */
    CategoryFieldType["SINGULAR"] = "categoryId";
    /** Entity uses plural field 'categoryIds' array (e.g., Model, Brand, ServiceType, SparePart) */
    CategoryFieldType["PLURAL"] = "categoryIds";
})(CategoryFieldType || (exports.CategoryFieldType = CategoryFieldType = {}));
class CategoryQueryBuilder {
    field;
    input = {};
    constructor(field) {
        this.field = field;
    }
    /** Initialize builder for entities with singular 'categoryId' field */
    static forSingular() {
        return new CategoryQueryBuilder(CategoryFieldType.SINGULAR);
    }
    /** Initialize builder for entities with plural 'categoryIds' array field */
    static forPlural() {
        return new CategoryQueryBuilder(CategoryFieldType.PLURAL);
    }
    /** Set input filters (handles both singular and plural inputs from API) */
    withFilters(input) {
        this.input = { ...this.input, ...input };
        return this;
    }
    /** Build the MongoDB query object */
    build() {
        const value = this.getFilterValue();
        if (value === undefined)
            return {};
        const fieldName = this.field === CategoryFieldType.SINGULAR ? 'categoryId' : 'categoryIds';
        return { [fieldName]: value };
    }
    /**
     * Get the query operand ($in or literal ID).
     * Useful for constructing composite queries with other operators.
     */
    getFilterValue() {
        const ids = this.getRawIds();
        if (ids.length === 0)
            return undefined;
        if (ids.length === 1)
            return new mongoose_1.default.Types.ObjectId(ids[0]);
        return { $in: ids.map(id => new mongoose_1.default.Types.ObjectId(id)) };
    }
    /**
     * Get the raw validated string IDs.
     * Prevents operator leakage when literal IDs are required (e.g., _id lookups).
     */
    getRawIds() {
        const { categoryId, categoryIds } = this.input;
        const idSet = new Set();
        if (typeof categoryId === 'string' && mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            idSet.add(categoryId);
        }
        if (Array.isArray(categoryIds)) {
            categoryIds.forEach(id => {
                if (typeof id === 'string' && mongoose_1.default.Types.ObjectId.isValid(id)) {
                    idSet.add(id);
                }
            });
        }
        return Array.from(idSet);
    }
}
exports.CategoryQueryBuilder = CategoryQueryBuilder;
exports.default = CategoryQueryBuilder;
//# sourceMappingURL=CategoryQueryBuilder.js.map