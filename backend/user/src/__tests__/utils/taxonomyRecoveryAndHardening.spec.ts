import mongoose from 'mongoose';
import Brand from '@esparex/core/models/Brand';
import Model from '@esparex/core/models/Model';

describe('Taxonomy Recovery & Hardening Unit Tests', () => {
    it('should synchronize categoryId to categoryIds on Brand validation', async () => {
        const categoryId = new mongoose.Types.ObjectId();
        
        const brand = new Brand({
            name: 'Test Brand',
            displayName: 'Test Brand',
            canonicalName: 'test-brand',
            slug: 'test-brand-12345',
            categoryId: categoryId,
            categoryIds: []
        });

        await brand.validate();

        expect(brand.categoryIds).toBeDefined();
        expect(brand.categoryIds.length).toBe(1);
        expect(brand.categoryIds[0].toString()).toBe(categoryId.toString());
    });

    it('should synchronize categoryIds to categoryId on Brand validation', async () => {
        const categoryId = new mongoose.Types.ObjectId();
        
        const brand = new Brand({
            name: 'Test Brand 2',
            displayName: 'Test Brand 2',
            canonicalName: 'test-brand-2',
            slug: 'test-brand-2-12345',
            categoryIds: [categoryId]
        });

        await brand.validate();

        expect(brand.categoryId).toBeDefined();
        expect(brand.categoryId?.toString()).toBe(categoryId.toString());
    });

    it('should synchronize categoryId to categoryIds on Model validation', async () => {
        const brandId = new mongoose.Types.ObjectId();
        const categoryId = new mongoose.Types.ObjectId();
        
        const modelDoc = new Model({
            name: 'Test Model',
            displayName: 'Test Model',
            canonicalName: 'test-model',
            slug: 'test-model-12345',
            brandId: brandId,
            categoryId: categoryId,
            categoryIds: []
        });

        await modelDoc.validate();

        expect(modelDoc.categoryIds).toBeDefined();
        expect(modelDoc.categoryIds.length).toBe(1);
        expect(modelDoc.categoryIds[0].toString()).toBe(categoryId.toString());
    });

    it('should synchronize categoryIds to categoryId on Model validation', async () => {
        const brandId = new mongoose.Types.ObjectId();
        const categoryId = new mongoose.Types.ObjectId();
        
        const modelDoc = new Model({
            name: 'Test Model 2',
            displayName: 'Test Model 2',
            canonicalName: 'test-model-2',
            slug: 'test-model-2-12345',
            brandId: brandId,
            categoryIds: [categoryId]
        });

        await modelDoc.validate();

        expect(modelDoc.categoryId).toBeDefined();
        expect(modelDoc.categoryId?.toString()).toBe(categoryId.toString());
    });
});
