import mongoose from 'mongoose';
import CategoryQueryBuilder from '../../utils/CategoryQueryBuilder';
import { CatalogFacade } from '@esparex/shared';

describe('CatalogCategoryHierarchy & CategoryQueryBuilder Safety', () => {
    it('should canonicalize category slugs using CatalogFacade in @esparex/shared', () => {
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug('mobiles')).toBe('mobiles');
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug('smartphones')).toBe('mobiles');
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug('laptop')).toBe('laptops');
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug('mobile-phones')).toBe('mobiles');
    });

    it('should generate empty query {} for explicitly empty categoryIds array without categoryId (no null injection)', () => {
        const query = CategoryQueryBuilder.forSingular()
            .withFilters({ categoryIds: [] })
            .build();
        expect(query).toEqual({});
        expect(query).not.toHaveProperty('categoryId', null);
    });

    it('should generate $in query when multiple valid subcategory ObjectIds are provided', () => {
        const id1 = new mongoose.Types.ObjectId().toString();
        const id2 = new mongoose.Types.ObjectId().toString();
        const query = CategoryQueryBuilder.forSingular()
            .withFilters({ categoryIds: [id1, id2] })
            .build();
        expect(query).toHaveProperty('categoryId');
        expect((query.categoryId as any).$in).toHaveLength(2);
    });

    it('should return empty string for null, undefined, or whitespace slug inputs', () => {
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug(null)).toBe('');
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug(undefined)).toBe('');
        expect(CatalogFacade.category.normalize.canonicalizeCategorySlug('   ')).toBe('');
    });
});
