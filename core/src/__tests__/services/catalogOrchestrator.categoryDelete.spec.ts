import { CatalogOrchestratorImpl } from '../../domains/catalog/application/services/CatalogOrchestrator';
import { AppError } from '../../utils/AppError';
import { LISTING_TYPE, CATALOG_APPROVAL_STATUS } from '@esparex/contracts';
import {
    CatalogUnitOfWorkPort,
    CatalogCachePort,
    CategoryRepositoryPort,
    BrandRepositoryPort,
    ModelRepositoryPort,
    SparePartRepositoryPort,
    ScreenSizeRepositoryPort,
    Category
} from '../../domains/catalog';

describe('CatalogOrchestrator - Category Delete Idempotency & Cache Invalidation', () => {
    let orchestrator: CatalogOrchestratorImpl;
    let mockUnitOfWork: any;
    let mockCacheService: any;
    let mockCategoryRepo: any;
    let mockBrandRepo: any;
    let mockModelRepo: any;
    let mockSparePartRepo: any;
    let mockScreenSizeRepo: any;

    const sampleCategory: Category = {
        id: '65fa29c9d2c1f2e165fa29c1',
        _id: '65fa29c9d2c1f2e165fa29c1',
        name: 'Mobiles',
        displayName: 'Mobiles',
        canonicalName: 'mobiles',
        slug: 'mobiles',
        isActive: true,
        isDeleted: false,
        configuration: {
            listingTypes: [LISTING_TYPE.AD],
            serviceSelectionMode: 'multi',
            approvalStatus: CATALOG_APPROVAL_STATUS.APPROVED,
            hasScreenSizes: true
        }
    };

    beforeEach(() => {
        mockUnitOfWork = {
            executeTransaction: jest.fn().mockImplementation(async (work) => work({}))
        };

        mockCacheService = {
            invalidateCatalogCache: jest.fn().mockResolvedValue(undefined)
        };

        mockCategoryRepo = {
            findById: jest.fn(),
            findBySlug: jest.fn(),
            exists: jest.fn(),
            resolveActiveCategoryIds: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn().mockResolvedValue(true),
            findActive: jest.fn()
        };

        mockBrandRepo = {
            findById: jest.fn(),
            findByNameAndCategory: jest.fn(),
            findByCategory: jest.fn().mockResolvedValue([]),
            exists: jest.fn(),
            updateCategoryIds: jest.fn(),
            softDelete: jest.fn(),
            softDeleteMany: jest.fn().mockResolvedValue(0)
        };

        mockModelRepo = {
            findById: jest.fn(),
            findByCategoryOrBrands: jest.fn().mockResolvedValue([]),
            updateCategoryIds: jest.fn(),
            softDeleteMany: jest.fn().mockResolvedValue(0)
        };

        mockSparePartRepo = {
            findById: jest.fn(),
            findByCategoryOrBrands: jest.fn().mockResolvedValue([]),
            exists: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn().mockResolvedValue(true),
            softDeleteMany: jest.fn().mockResolvedValue(0),
            softDeleteByBrandId: jest.fn().mockResolvedValue(0),
            softDeleteByModelIds: jest.fn().mockResolvedValue(0),
            updateCategoryIds: jest.fn().mockResolvedValue(true),
            clearModelReferences: jest.fn().mockResolvedValue(0)
        };

        mockScreenSizeRepo = {
            softDeleteByCriteria: jest.fn().mockResolvedValue(0)
        };

        orchestrator = new CatalogOrchestratorImpl(
            mockUnitOfWork,
            mockCacheService,
            mockCategoryRepo,
            mockBrandRepo,
            mockModelRepo,
            mockSparePartRepo,
            mockScreenSizeRepo
        );
    });

    it('successfully soft-deletes an active category and invalidates caches', async () => {
        mockCategoryRepo.findById.mockResolvedValueOnce(sampleCategory);

        const result = await orchestrator.deleteCategoryOrchestrated(sampleCategory.id);

        expect(result).toEqual({ id: sampleCategory.id, alreadyDeleted: false });
        expect(mockCategoryRepo.findById).toHaveBeenCalledWith(sampleCategory.id, true);
        expect(mockCategoryRepo.softDelete).toHaveBeenCalledWith(sampleCategory.id, expect.anything());
        expect(mockCacheService.invalidateCatalogCache).toHaveBeenCalledWith({
            categoryIds: [sampleCategory.id]
        });
    });

    it('returns alreadyDeleted: true idempotently if category is already soft-deleted without throwing 404', async () => {
        mockCategoryRepo.findById.mockResolvedValueOnce({
            ...sampleCategory,
            isActive: false,
            isDeleted: true
        });

        const result = await orchestrator.deleteCategoryOrchestrated(sampleCategory.id);

        expect(result).toEqual({ id: sampleCategory.id, alreadyDeleted: true });
        expect(mockCategoryRepo.softDelete).not.toHaveBeenCalled();
        expect(mockCacheService.invalidateCatalogCache).toHaveBeenCalledWith({
            categoryIds: [sampleCategory.id]
        });
    });

    it('throws 404 CATEGORY_NOT_FOUND when category truly does not exist in database', async () => {
        mockCategoryRepo.findById.mockResolvedValueOnce(null);

        await expect(orchestrator.deleteCategoryOrchestrated('nonexistent-id')).rejects.toThrow(AppError);
        await expect(orchestrator.deleteCategoryOrchestrated('nonexistent-id')).rejects.toMatchObject({
            statusCode: 404,
            code: 'CATEGORY_NOT_FOUND'
        });
    });
});
