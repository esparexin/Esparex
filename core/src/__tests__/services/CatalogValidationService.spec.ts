import { CatalogValidationService } from '../../services/catalog/CatalogValidationService';
import { CategoryRepositoryPort, BrandRepositoryPort } from '../../domains/catalog';

describe('CatalogValidationService Mock-Based Testing', () => {
    const mockCategoryRepository = {
        findById: jest.fn(),
        findBySlug: jest.fn(),
        exists: jest.fn(),
        resolveActiveCategoryIds: jest.fn(),
    } as unknown as jest.Mocked<CategoryRepositoryPort>;

    const mockBrandRepository = {
        findById: jest.fn(),
        findByNameAndCategory: jest.fn(),
        exists: jest.fn(),
    } as unknown as jest.Mocked<BrandRepositoryPort>;

    const service = new CatalogValidationService(mockCategoryRepository, mockBrandRepository);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor & Setup', () => {
        it('should initialize successfully with repository ports', () => {
            expect(service).toBeInstanceOf(CatalogValidationService);
        });
    });

    describe('validateBrandBelongsToCategory', () => {
        it('should fail if brand is not active', async () => {
            mockBrandRepository.findById.mockResolvedValueOnce({
                id: 'brand-1',
                name: 'Brand 1',
                canonicalName: 'brand 1',
                isActive: false,
                isDeleted: false,
                categoryIds: ['cat-1'],
                approvalStatus: 'approved',
            });

            const result = await service.validateBrandBelongsToCategory('65fa29c9d2c1f2e165fa29ca', '65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(false);
            expect(result.reason).toContain('Brand is invalid, inactive, or does not belong');
        });

        it('should fail if brand does not belong to category', async () => {
            mockBrandRepository.findById.mockResolvedValueOnce({
                id: 'brand-1',
                name: 'Brand 1',
                canonicalName: 'brand 1',
                isActive: true,
                isDeleted: false,
                categoryIds: ['cat-2'],
                approvalStatus: 'approved',
            });

            const result = await service.validateBrandBelongsToCategory('65fa29c9d2c1f2e165fa29ca', '65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(false);
        });

        it('should pass if brand belongs and is active', async () => {
            mockBrandRepository.findById.mockResolvedValueOnce({
                id: 'brand-1',
                name: 'Brand 1',
                canonicalName: 'brand 1',
                isActive: true,
                isDeleted: false,
                categoryIds: ['65fa29c9d2c1f2e165fa29c9'],
                approvalStatus: 'approved',
            });

            const result = await service.validateBrandBelongsToCategory('65fa29c9d2c1f2e165fa29ca', '65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(true);
        });
    });

    describe('validateBrandIsActive', () => {
        it('should pass if brand is active and approved', async () => {
            mockBrandRepository.findById.mockResolvedValueOnce({
                id: 'brand-1',
                name: 'Brand 1',
                canonicalName: 'brand 1',
                isActive: true,
                isDeleted: false,
                categoryIds: [],
                approvalStatus: 'approved',
            });

            const result = await service.validateBrandIsActive('65fa29c9d2c1f2e165fa29ca');
            expect(result.ok).toBe(true);
        });

        it('should pass if brand is active and pending', async () => {
            mockBrandRepository.findById.mockResolvedValueOnce({
                id: 'brand-1',
                name: 'Brand 1',
                canonicalName: 'brand 1',
                isActive: true,
                isDeleted: false,
                categoryIds: [],
                approvalStatus: 'pending',
            });

            const result = await service.validateBrandIsActive('65fa29c9d2c1f2e165fa29ca');
            expect(result.ok).toBe(true);
        });

        it('should fail if brand is rejected', async () => {
            mockBrandRepository.findById.mockResolvedValueOnce({
                id: 'brand-1',
                name: 'Brand 1',
                canonicalName: 'brand 1',
                isActive: true,
                isDeleted: false,
                categoryIds: [],
                approvalStatus: 'rejected',
            });

            const result = await service.validateBrandIsActive('65fa29c9d2c1f2e165fa29ca');
            expect(result.ok).toBe(false);
        });
    });

    describe('validateCategoryIsActive', () => {
        it('should pass if category is active and approved', async () => {
            mockCategoryRepository.findById.mockResolvedValueOnce({
                id: 'cat-1',
                name: 'Category 1',
                displayName: 'Cat 1',
                canonicalName: 'category 1',
                slug: 'cat-1',
                isActive: true,
                isDeleted: false,
                configuration: {
                    listingTypes: [],
                    serviceSelectionMode: 'multi',
                    approvalStatus: 'approved',
                    hasScreenSizes: false,
                }
            });

            const result = await service.validateCategoryIsActive('65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(true);
        });

        it('should fail if category is pending or rejected', async () => {
            mockCategoryRepository.findById.mockResolvedValueOnce({
                id: 'cat-1',
                name: 'Category 1',
                displayName: 'Cat 1',
                canonicalName: 'category 1',
                slug: 'cat-1',
                isActive: true,
                isDeleted: false,
                configuration: {
                    listingTypes: [],
                    serviceSelectionMode: 'multi',
                    approvalStatus: 'pending',
                    hasScreenSizes: false,
                }
            });

            const result = await service.validateCategoryIsActive('65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(false);
        });
    });

    describe('validateAdCategoryCapability', () => {
        it('should fail if category does not support ads', async () => {
            mockCategoryRepository.findById.mockResolvedValueOnce({
                id: 'cat-1',
                name: 'Category 1',
                displayName: 'Cat 1',
                canonicalName: 'category 1',
                slug: 'cat-1',
                isActive: true,
                isDeleted: false,
                configuration: {
                    listingTypes: ['service'],
                    serviceSelectionMode: 'multi',
                    approvalStatus: 'approved',
                    hasScreenSizes: false,
                }
            });

            const result = await service.validateAdCategoryCapability('65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(false);
            expect(result.reason).toContain('does not support advertisements');
        });

        it('should pass if category supports ads', async () => {
            mockCategoryRepository.findById.mockResolvedValueOnce({
                id: 'cat-1',
                name: 'Category 1',
                displayName: 'Cat 1',
                canonicalName: 'category 1',
                slug: 'cat-1',
                isActive: true,
                isDeleted: false,
                configuration: {
                    listingTypes: ['ad'],
                    serviceSelectionMode: 'multi',
                    approvalStatus: 'approved',
                    hasScreenSizes: false,
                }
            });

            const result = await service.validateAdCategoryCapability('65fa29c9d2c1f2e165fa29c9');
            expect(result.ok).toBe(true);
        });
    });
});
