import mongoose from 'mongoose';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';

describe('CategoryQueryBuilder Unit Tests', () => {
    const validId = '507f1f77bcf86cd799439011';
    const secondValidId = '507f1f77bcf86cd799439012';
    const validObjectId = new mongoose.Types.ObjectId(validId);
    const secondValidObjectId = new mongoose.Types.ObjectId(secondValidId);

    describe('forEntity SSOT Helper and Entity Cardinality', () => {
        it('uses plural categoryIds array query for Brand', () => {
            const query = CategoryQueryBuilder.forEntity('Brand')
                .withFilters({ categoryIds: [validId] })
                .build();

            expect(query).toEqual({ categoryIds: validObjectId });
            expect(query).not.toHaveProperty('categoryId');
        });

        it('uses plural categoryIds array query for Model', () => {
            const query = CategoryQueryBuilder.forEntity('Model')
                .withFilters({ categoryIds: [validId] })
                .build();

            expect(query).toEqual({ categoryIds: validObjectId });
            expect(query).not.toHaveProperty('categoryId');
        });

        it('uses plural categoryIds array query for SparePart', () => {
            const query = CategoryQueryBuilder.forEntity('SparePart')
                .withFilters({ categoryIds: [validId] })
                .build();

            expect(query).toEqual({ categoryIds: validObjectId });
        });

        it('uses plural categoryIds array query for ServiceType', () => {
            const query = CategoryQueryBuilder.forEntity('ServiceType')
                .withFilters({ categoryIds: [validId] })
                .build();

            expect(query).toEqual({ categoryIds: validObjectId });
        });

        it('uses singular categoryId field query for ScreenSize', () => {
            const query = CategoryQueryBuilder.forEntity('ScreenSize')
                .withFilters({ categoryId: validId })
                .build();

            expect(query).toEqual({ categoryId: validObjectId });
            expect(query).not.toHaveProperty('categoryIds');
        });

        it('uses singular categoryId field query for Ad', () => {
            const query = CategoryQueryBuilder.forEntity('Ad')
                .withFilters({ categoryId: validId })
                .build();

            expect(query).toEqual({ categoryId: validObjectId });
            expect(query).not.toHaveProperty('categoryIds');
        });
    });

    describe('forSingular()', () => {
        it('should build a single ObjectId filter when one categoryId is provided', () => {
            const query = CategoryQueryBuilder.forSingular()
                .withFilters({ categoryId: validId })
                .build();

            expect(query).toEqual({
                categoryId: validObjectId,
            });
        });

        it('should build an $in filter when multiple categoryIds are provided', () => {
            const query = CategoryQueryBuilder.forSingular()
                .withFilters({ categoryIds: [validId, secondValidId] })
                .build();

            expect(query).toEqual({
                categoryId: {
                    $in: [validObjectId, secondValidObjectId],
                },
            });
        });

        it('should return empty object {} when categoryIds is an empty array without categoryId (no null injection)', () => {
            const query = CategoryQueryBuilder.forSingular()
                .withFilters({ categoryIds: [] })
                .build();

            expect(query).toEqual({});
            expect(query).not.toHaveProperty('categoryId', null);
        });

        it('should return empty object {} when no category filters are provided', () => {
            const query = CategoryQueryBuilder.forSingular()
                .withFilters({})
                .build();

            expect(query).toEqual({});
        });
    });

    describe('forPlural()', () => {
        it('should build categoryIds query for plural entities with single ID', () => {
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({ categoryIds: [validId] })
                .build();

            expect(query).toEqual({
                categoryIds: validObjectId,
            });
        });

        it('should build categoryIds query for plural entities with multiple IDs', () => {
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({ categoryIds: [validId, secondValidId] })
                .build();

            expect(query).toEqual({
                categoryIds: {
                    $in: [validObjectId, secondValidObjectId],
                },
            });
        });

        it('should return empty object {} when plural categoryIds is an empty array', () => {
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({ categoryIds: [] })
                .build();

            expect(query).toEqual({});
            expect(query).not.toHaveProperty('categoryIds', null);
        });

        it('returns empty query when no IDs are provided', () => {
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({})
                .build();

            expect(query).toEqual({});
        });
    });
});
