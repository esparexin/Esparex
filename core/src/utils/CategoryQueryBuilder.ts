import mongoose from 'mongoose';

/**
 * CategoryQueryBuilder
 * 
 * SSOT for constructing MongoDB category filters across different catalog entities.
 * Ensures strict type handling and prevents "logical drift" during query construction.
 */

export enum CategoryFieldType {
    /** Entity uses singular field 'categoryId' (e.g., Ad, ScreenSize) */
    SINGULAR = 'categoryId',
    /** Entity uses plural field 'categoryIds' array (e.g., Model, Brand, ServiceType, SparePart) */
    PLURAL = 'categoryIds'
}

export interface CategoryQueryInput {
    categoryId?: string | null;
    categoryIds?: string[] | null;
}

export class CategoryQueryBuilder {
    private readonly field: CategoryFieldType;
    private input: CategoryQueryInput = {};

    private constructor(field: CategoryFieldType) {
        this.field = field;
    }

    /** Initialize builder for entities with singular 'categoryId' field */
    static forSingular(): CategoryQueryBuilder {
        return new CategoryQueryBuilder(CategoryFieldType.SINGULAR);
    }

    /** Initialize builder for entities with plural 'categoryIds' array field */
    static forPlural(): CategoryQueryBuilder {
        return new CategoryQueryBuilder(CategoryFieldType.PLURAL);
    }

    /** Set input filters for query construction. */
    withFilters(input: CategoryQueryInput): this {
        this.input = { ...this.input, ...input };
        return this;
    }

    /** Build the MongoDB query object */
    build(): Record<string, unknown> {
        const value = this.getFilterValue();
        if (value === undefined) return {};
        const fieldName = this.field === CategoryFieldType.SINGULAR ? 'categoryId' : 'categoryIds';
        return { [fieldName]: value };
    }

    /** 
     * Get the query operand ($in or literal ID).
     * Useful for constructing composite queries with other operators.
     */
    getFilterValue(): mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] } | undefined {
        const ids = this.getRawIds();
        if (ids.length === 0) return undefined;
        if (ids.length === 1) return new mongoose.Types.ObjectId(ids[0]);
        return { $in: ids.map(id => new mongoose.Types.ObjectId(id)) };
    }

    /** 
     * Get the raw validated string IDs.
     * Prevents operator leakage when literal IDs are required (e.g., _id lookups).
     */
    getRawIds(): string[] {
        const { categoryId, categoryIds } = this.input;
        const idSet = new Set<string>();

        const addIfValid = (value: unknown) => {
            if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
                idSet.add(value);
            }
        };

        if (this.field === CategoryFieldType.PLURAL) {
            // SSOT: plural entities only accept canonical categoryIds input.
            if (Array.isArray(categoryIds)) {
                categoryIds.forEach(addIfValid);
            }
            return Array.from(idSet);
        }

        // Singular entities can accept one or many filter IDs for categoryId lookups.
        addIfValid(categoryId);
        if (Array.isArray(categoryIds)) {
            categoryIds.forEach(addIfValid);
        }
        return Array.from(idSet);
    }
}

export default CategoryQueryBuilder;
