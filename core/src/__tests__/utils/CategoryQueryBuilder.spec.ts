import mongoose from 'mongoose';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';

describe('CategoryQueryBuilder SSOT and Entity Cardinality', () => {
    const validId = '507f1f77bcf86cd799439011';
    const validObjectId = new mongoose.Types.ObjectId(validId);

    describe('forEntity SSOT Helper', () => {
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

    describe('Query Construction Invariants', () => {
        it('returns empty query when no IDs are provided', () => {
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({})
                .build();

            expect(query).toEqual({});
        });

        it('handles array of multiple category IDs with $in operator', () => {
            const secondId = '507f1f77bcf86cd799439012';
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({ categoryIds: [validId, secondId] })
                .build();

            expect(query).toEqual({
                categoryIds: {
                    $in: [
                        new mongoose.Types.ObjectId(validId),
                        new mongoose.Types.ObjectId(secondId),
                    ],
                },
            });
        });
    });
});
