import mongoose from 'mongoose';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';

describe('CategoryQueryBuilder Unit Tests', () => {
    const VALID_ID_1 = '65f0a1b2c3d4e5f607182931';
    const VALID_ID_2 = '65f0a1b2c3d4e5f607182932';

    describe('forSingular()', () => {
        it('should build a single ObjectId filter when one categoryId is provided', () => {
            const query = CategoryQueryBuilder.forSingular()
                .withFilters({ categoryId: VALID_ID_1 })
                .build();

            expect(query).toEqual({
                categoryId: new mongoose.Types.ObjectId(VALID_ID_1),
            });
        });

        it('should build an $in filter when multiple categoryIds are provided', () => {
            const query = CategoryQueryBuilder.forSingular()
                .withFilters({ categoryIds: [VALID_ID_1, VALID_ID_2] })
                .build();

            expect(query).toEqual({
                categoryId: {
                    $in: [
                        new mongoose.Types.ObjectId(VALID_ID_1),
                        new mongoose.Types.ObjectId(VALID_ID_2),
                    ],
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
        it('should build categoryIds query for plural entities', () => {
            const query = CategoryQueryBuilder.forPlural()
                .withFilters({ categoryIds: [VALID_ID_1, VALID_ID_2] })
                .build();

            expect(query).toEqual({
                categoryIds: {
                    $in: [
                        new mongoose.Types.ObjectId(VALID_ID_1),
                        new mongoose.Types.ObjectId(VALID_ID_2),
                    ],
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
    });
});
