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

    it('should generate null query for explicitly empty categoryIds array to prevent unfiltered leak', () => {
        const query = CategoryQueryBuilder.forSingular()
            .withFilters({ categoryIds: [] })
            .build();
        expect(query).toEqual({ categoryId: null });
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
});
