import { MongoCategoryRepositoryAdapter } from '../../../../../adapters/outbound/database/catalog/MongoCategoryRepositoryAdapter';
import { MongoBrandRepositoryAdapter } from '../../../../../adapters/outbound/database/catalog/MongoBrandRepositoryAdapter';
import CategoryModel from '../../../../../models/Category';
import BrandModel from '../../../../../models/Brand';

const mockLean = jest.fn();
const mockSelect = jest.fn();
const mockExec = jest.fn();

const mockQuery = {
    lean: mockLean,
    select: mockSelect,
    exec: mockExec,
};

mockLean.mockReturnValue(mockQuery);
mockSelect.mockReturnValue(mockQuery);

jest.mock('../../../../../models/Category', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
        find: jest.fn(() => mockQuery),
    },
}));

jest.mock('../../../../../models/Brand', () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
    },
}));

describe('Catalog Outbound Database Repositories', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockExec.mockReset();
    });

    describe('MongoCategoryRepositoryAdapter', () => {
        const repo = new MongoCategoryRepositoryAdapter();

        it('should implement CategoryRepositoryPort', () => {
            expect(typeof repo.findById).toBe('function');
            expect(typeof repo.findBySlug).toBe('function');
            expect(typeof repo.exists).toBe('function');
            expect(typeof repo.resolveActiveCategoryIds).toBe('function');
        });

        it('should return mapped domain category when entity is found', async () => {
            const dbCategory = {
                _id: '65fa29c9d2c1f2e165fa29c9',
                name: 'Electronics',
                displayName: 'Electronics Display',
                canonicalName: 'electronics',
                slug: 'electronics',
                isActive: true,
                isDeleted: false,
                listingType: ['ad'],
                serviceSelectionMode: 'single',
                approvalStatus: 'approved',
                hasScreenSizes: true,
            };
            mockExec.mockResolvedValueOnce(dbCategory);

            const result = await repo.findById('65fa29c9d2c1f2e165fa29c9');

            expect(CategoryModel.findById).toHaveBeenCalledWith('65fa29c9d2c1f2e165fa29c9');
            expect(result).toEqual({
                id: '65fa29c9d2c1f2e165fa29c9',
                _id: '65fa29c9d2c1f2e165fa29c9',
                name: 'Electronics',
                displayName: 'Electronics Display',
                canonicalName: 'electronics',
                slug: 'electronics',
                isActive: true,
                isDeleted: false,
                configuration: {
                    listingTypes: ['ad'],
                    serviceSelectionMode: 'single',
                    approvalStatus: 'approved',
                    hasScreenSizes: true,
                },
                filters: []
            });

            expect(result?.constructor).toBe(Object);
        });

        it('should return null when entity is missing', async () => {
            mockExec.mockResolvedValueOnce(null);

            const result = await repo.findById('non-existent');

            expect(result).toBeNull();
        });

        it('should find by slug and map correctly', async () => {
            const dbCategory = {
                _id: '65fa29c9d2c1f2e165fa29c9',
                name: 'Electronics',
                displayName: 'Electronics Display',
                canonicalName: 'electronics',
                slug: 'electronics-slug',
                isActive: true,
                isDeleted: false,
                listingType: ['service'],
                serviceSelectionMode: 'multi',
                approvalStatus: 'approved',
                hasScreenSizes: false,
            };
            mockExec.mockResolvedValueOnce(dbCategory);

            const result = await repo.findBySlug('electronics-slug');

            expect(CategoryModel.findOne).toHaveBeenCalledWith({ slug: 'electronics-slug' });
            expect(result).toEqual({
                id: '65fa29c9d2c1f2e165fa29c9',
                _id: '65fa29c9d2c1f2e165fa29c9',
                name: 'Electronics',
                displayName: 'Electronics Display',
                canonicalName: 'electronics',
                slug: 'electronics-slug',
                isActive: true,
                isDeleted: false,
                configuration: {
                    listingTypes: ['service'],
                    serviceSelectionMode: 'multi',
                    approvalStatus: 'approved',
                    hasScreenSizes: false,
                },
                filters: []
            });
            expect(result?.constructor).toBe(Object);
        });

        it('should return true for exists when record exists', async () => {
            mockExec.mockResolvedValueOnce({ _id: '65fa29c9d2c1f2e165fa29c9' });

            const result = await repo.exists('65fa29c9d2c1f2e165fa29c9');

            expect(CategoryModel.findById).toHaveBeenCalledWith('65fa29c9d2c1f2e165fa29c9');
            expect(result).toBe(true);
        });

        it('should return false for exists when record does not exist', async () => {
            mockExec.mockResolvedValueOnce(null);

            const result = await repo.exists('65fa29c9d2c1f2e165fa29c9');

            expect(result).toBe(false);
        });

        it('should resolve active category IDs without filters', async () => {
            mockExec.mockResolvedValueOnce([
                { _id: 'id1' },
                { _id: 'id2' }
            ]);

            const result = await repo.resolveActiveCategoryIds();

            expect(CategoryModel.find).toHaveBeenCalledWith({
                isActive: true,
                isDeleted: { $ne: true },
                approvalStatus: 'approved',
            });
            expect(result).toEqual(['id1', 'id2']);
        });

        it('should resolve active category IDs with filters', async () => {
            mockExec.mockResolvedValueOnce([
                { _id: 'id1' }
            ]);

            const result = await repo.resolveActiveCategoryIds(['id1', 'id3']);

            expect(CategoryModel.find).toHaveBeenCalledWith({
                isActive: true,
                isDeleted: { $ne: true },
                approvalStatus: 'approved',
                _id: { $in: ['id1', 'id3'] }
            });
            expect(result).toEqual(['id1']);
        });
    });

    describe('MongoBrandRepositoryAdapter', () => {
        const repo = new MongoBrandRepositoryAdapter();

        it('should implement BrandRepositoryPort', () => {
            expect(typeof repo.findById).toBe('function');
            expect(typeof repo.findByNameAndCategory).toBe('function');
            expect(typeof repo.exists).toBe('function');
        });

        it('should return mapped domain brand when entity is found', async () => {
            const dbBrand = {
                _id: '65fa29c9d2c1f2e165fa29ca',
                name: 'Samsung',
                canonicalName: 'samsung',
                isActive: true,
                isDeleted: false,
                categoryIds: ['65fa29c9d2c1f2e165fa29c9'],
                approvalStatus: 'approved',
            };
            mockExec.mockResolvedValueOnce(dbBrand);

            const result = await repo.findById('65fa29c9d2c1f2e165fa29ca');

            expect(BrandModel.findById).toHaveBeenCalledWith('65fa29c9d2c1f2e165fa29ca');
            expect(result).toEqual({
                id: '65fa29c9d2c1f2e165fa29ca',
                name: 'Samsung',
                canonicalName: 'samsung',
                isActive: true,
                isDeleted: false,
                categoryIds: ['65fa29c9d2c1f2e165fa29c9'],
                approvalStatus: 'approved',
            });

            expect(result?.constructor).toBe(Object);
        });

        it('should return null when entity is missing', async () => {
            mockExec.mockResolvedValueOnce(null);

            const result = await repo.findById('non-existent');

            expect(result).toBeNull();
        });

        it('should find by name and category and map correctly', async () => {
            const dbBrand = {
                _id: '65fa29c9d2c1f2e165fa29ca',
                name: 'Samsung',
                canonicalName: 'samsung',
                isActive: true,
                isDeleted: false,
                categoryIds: ['65fa29c9d2c1f2e165fa29c9'],
                approvalStatus: 'pending',
            };
            mockExec.mockResolvedValueOnce(dbBrand);

            const result = await repo.findByNameAndCategory('Samsung  ', '65fa29c9d2c1f2e165fa29c9');

            expect(BrandModel.findOne).toHaveBeenCalledWith({
                canonicalName: 'samsung',
                categoryIds: '65fa29c9d2c1f2e165fa29c9',
            });
            expect(result).toEqual({
                id: '65fa29c9d2c1f2e165fa29ca',
                name: 'Samsung',
                canonicalName: 'samsung',
                isActive: true,
                isDeleted: false,
                categoryIds: ['65fa29c9d2c1f2e165fa29c9'],
                approvalStatus: 'pending',
            });
            expect(result?.constructor).toBe(Object);
        });

        it('should return true for exists when record exists', async () => {
            mockExec.mockResolvedValueOnce({ _id: '65fa29c9d2c1f2e165fa29ca' });

            const result = await repo.exists('65fa29c9d2c1f2e165fa29ca');

            expect(BrandModel.findById).toHaveBeenCalledWith('65fa29c9d2c1f2e165fa29ca');
            expect(result).toBe(true);
        });

        it('should return false for exists when record does not exist', async () => {
            mockExec.mockResolvedValueOnce(null);

            const result = await repo.exists('65fa29c9d2c1f2e165fa29ca');

            expect(result).toBe(false);
        });
    });
});
