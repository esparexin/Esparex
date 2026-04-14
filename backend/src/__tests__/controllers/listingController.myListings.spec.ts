const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockSendSuccessResponse = jest.fn();
const mockSendErrorResponse = jest.fn();
const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

const mockCategoryModel = { modelName: 'Category' };
const mockBrandModel = { modelName: 'Brand' };
const mockProductModel = { modelName: 'Model' };
const mockSparePartModel = { modelName: 'SparePart' };
const mockServiceTypeModel = { modelName: 'ServiceType' };

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        find: mockFind,
        countDocuments: mockCountDocuments,
    },
}));

jest.mock('../../models/Category', () => ({
    __esModule: true,
    default: mockCategoryModel,
}));

jest.mock('../../models/Brand', () => ({
    __esModule: true,
    default: mockBrandModel,
}));

jest.mock('../../models/Model', () => ({
    __esModule: true,
    default: mockProductModel,
}));

jest.mock('../../models/SparePart', () => ({
    __esModule: true,
    default: mockSparePartModel,
}));

jest.mock('../../models/ServiceType', () => ({
    __esModule: true,
    default: mockServiceTypeModel,
}));

jest.mock('../../utils/respond', () => ({
    sendSuccessResponse: mockSendSuccessResponse,
}));

jest.mock('../../utils/errorResponse', () => ({
    sendErrorResponse: mockSendErrorResponse,
}));

jest.mock('../../utils/logger', () => ({
    __esModule: true,
    default: mockLogger,
}));

import { getMyListings } from '../../controllers/listing/listingController';

describe('listingController.getMyListings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses explicit models for admin-owned populate paths before returning listings', async () => {
        const queryBuilder = {
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([{ _id: 'listing-1' }]),
        };

        mockFind.mockReturnValue(queryBuilder);
        mockCountDocuments.mockResolvedValue(1);

        const req = {
            user: { _id: 'seller-1' },
            query: { type: 'ad', status: 'live', page: '2', limit: '5' },
        } as any;
        const res = {} as any;

        await getMyListings(req, res);

        expect(mockFind).toHaveBeenCalledWith(
            expect.objectContaining({
                sellerId: 'seller-1',
                isDeleted: { $ne: true },
                status: { $in: ['live', 'approved', 'active', 'published'] },
            })
        );
        expect(queryBuilder.populate).toHaveBeenNthCalledWith(1, expect.objectContaining({ path: 'categoryId', model: mockCategoryModel }));
        expect(queryBuilder.populate).toHaveBeenNthCalledWith(2, expect.objectContaining({ path: 'brandId', model: mockBrandModel }));
        expect(queryBuilder.populate).toHaveBeenNthCalledWith(3, expect.objectContaining({ path: 'modelId', model: mockProductModel }));
        expect(queryBuilder.populate).toHaveBeenNthCalledWith(4, expect.objectContaining({ path: 'sparePartId', model: mockSparePartModel }));
        expect(queryBuilder.populate).toHaveBeenNthCalledWith(5, expect.objectContaining({ path: 'serviceTypeIds', model: mockServiceTypeModel }));
        expect(queryBuilder.sort).toHaveBeenCalledWith({ createdAt: -1 });
        expect(queryBuilder.skip).toHaveBeenCalledWith(5);
        expect(queryBuilder.limit).toHaveBeenCalledWith(5);
        expect(mockSendSuccessResponse).toHaveBeenCalledWith(
            res,
            {
                items: [{ _id: 'listing-1' }],
                pagination: {
                    total: 1,
                    page: 2,
                    limit: 5,
                    hasMore: false,
                },
            }
        );
    });

    it('logs the underlying failure before returning the generic 500 response', async () => {
        const failure = new Error('unsafe populate');
        mockFind.mockImplementation(() => {
            throw failure;
        });

        const req = {
            user: { _id: 'seller-9', toString: () => 'seller-9' },
            query: { type: 'ad', status: 'live' },
        } as any;
        const res = {} as any;

        await getMyListings(req, res);

        expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to fetch owner listings',
            expect.objectContaining({
                userId: 'seller-9',
                query: req.query,
                error: 'unsafe populate',
                stack: failure.stack,
            })
        );
        expect(mockSendErrorResponse).toHaveBeenCalledWith(req, res, 500, 'Failed to fetch your listings');
    });
});
