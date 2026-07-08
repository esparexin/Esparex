import { describe, it, expect } from 'vitest';
import {
    adminCategorySchema,
    adminBrandSchema,
    adminModelSchema,
    adminCreateUserFormSchema,
    adminEditUserFormSchema,
} from '@/schemas/admin.schemas';

describe('adminCategorySchema', () => {
    it('accepts valid category', () => {
        const result = adminCategorySchema.safeParse({
            name: 'Electronics',
            slug: 'electronics',
        });
        expect(result.success).toBe(true);
    });

    it('rejects short name', () => {
        const result = adminCategorySchema.safeParse({ name: 'A', slug: 'a' });
        expect(result.success).toBe(false);
    });

    it('rejects slug with uppercase letters', () => {
        const result = adminCategorySchema.safeParse({ name: 'Test', slug: 'Test-Slug' });
        expect(result.success).toBe(false);
    });

    it('accepts listingType values from shared enum', () => {
        const result = adminCategorySchema.safeParse({
            name: 'Vehicles',
            slug: 'vehicles',
            listingType: ['ad'],
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid listingType', () => {
        const result = adminCategorySchema.safeParse({
            name: 'Test',
            slug: 'test',
            listingType: ['invalid_type'],
        });
        expect(result.success).toBe(false);
    });
});

describe('adminBrandSchema', () => {
    it('accepts valid brand', () => {
        const result = adminBrandSchema.safeParse({
            name: 'Toyota',
            categoryIds: ['507f1f77bcf86cd799439011'],
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
        const result = adminBrandSchema.safeParse({
            name: '',
            categoryIds: ['507f1f77bcf86cd799439011'],
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid ObjectId', () => {
        const result = adminBrandSchema.safeParse({
            name: 'Toyota',
            categoryIds: ['not-an-objectid'],
        });
        expect(result.success).toBe(false);
    });
});

describe('adminModelSchema', () => {
    it('accepts valid model', () => {
        const result = adminModelSchema.safeParse({
            name: 'Camry',
            brandId: '507f1f77bcf86cd799439011',
            categoryIds: ['507f1f77bcf86cd799439011'],
        });
        expect(result.success).toBe(true);
    });

    it('accepts optional parent fields', () => {
        const result = adminModelSchema.safeParse({
            name: 'Camry LE',
            brandId: '507f1f77bcf86cd799439011',
            categoryIds: ['507f1f77bcf86cd799439011'],
            parentModelId: null,
            variantOfModelId: null,
        });
        expect(result.success).toBe(true);
    });
});

describe('adminCreateUserFormSchema', () => {
    it('accepts valid create user input', () => {
        const result = adminCreateUserFormSchema.safeParse({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'admin',
            permissionsText: 'users:read, ads:write',
            password: 'password123',
        });
        expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
        const result = adminCreateUserFormSchema.safeParse({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'admin',
            permissionsText: 'users:read',
            password: '123',
        });
        expect(result.success).toBe(false);
    });
});

describe('adminEditUserFormSchema', () => {
    it('accepts valid edit input', () => {
        const result = adminEditUserFormSchema.safeParse({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'admin',
            permissionsText: 'users:read',
            status: 'live',
        });
        expect(result.success).toBe(true);
    });
});
