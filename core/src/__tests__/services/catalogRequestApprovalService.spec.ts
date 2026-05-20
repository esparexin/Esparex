import mongoose from 'mongoose';

const mockGetUserConnection = jest.fn();
const mockCatalogRequestFindById = jest.fn();
const mockBrandFindOne = jest.fn();
const mockBrandCreate = jest.fn();
const mockCategoryFindOne = jest.fn();
const mockModelFindOne = jest.fn();
const mockModelCreate = jest.fn();
const mockAdUpdateMany = jest.fn();
const mockAdDistinct = jest.fn();
const mockInvalidateCatalogCache = jest.fn();
const mockNotifySellersOfApproval = jest.fn();

jest.mock('@esparex/core/config/db', () => ({
    getUserConnection: () => mockGetUserConnection(),
}));

jest.mock('@esparex/core/models/CatalogRequest', () => ({
    __esModule: true,
    default: {
        findById: (...args: unknown[]) => mockCatalogRequestFindById(...args),
    },
    CATALOG_REQUEST_STATUS_VALUES: ['pending', 'approved', 'rejected', 'duplicate'],
}));

jest.mock('@esparex/core/models/Brand', () => ({
    __esModule: true,
    default: {
        findOne: (...args: unknown[]) => mockBrandFindOne(...args),
        create: (...args: unknown[]) => mockBrandCreate(...args),
    },
}));

jest.mock('@esparex/core/models/Category', () => ({
    __esModule: true,
    default: {
        findOne: (...args: unknown[]) => mockCategoryFindOne(...args),
    },
}));

jest.mock('@esparex/core/models/Model', () => ({
    __esModule: true,
    default: {
        findOne: (...args: unknown[]) => mockModelFindOne(...args),
        create: (...args: unknown[]) => mockModelCreate(...args),
    },
}));

jest.mock('@esparex/core/models/Ad', () => ({
    __esModule: true,
    default: {
        distinct: (...args: unknown[]) => mockAdDistinct(...args),
        updateMany: (...args: unknown[]) => mockAdUpdateMany(...args),
    },
}));

jest.mock('@esparex/core/services/catalog/CatalogNotificationService', () => ({
    __esModule: true,
    CatalogNotificationService: {
        notifySellersOfApproval: (...args: unknown[]) => mockNotifySellersOfApproval(...args),
    },
}));

jest.mock('@esparex/core/services/catalog/CatalogOrchestrator', () => ({
    __esModule: true,
    default: {
        invalidateCatalogCache: (...args: unknown[]) => mockInvalidateCatalogCache(...args),
    },
}));

import {
    approveCatalogRequest,
    markCatalogRequestDuplicate,
    rejectCatalogRequest,
} from '@esparex/core/services/catalogRequestApprovalService';

const buildSession = () => {
    const session = {
        withTransaction: jest.fn(async (operation: () => Promise<void>) => {
            await operation();
        }),
        endSession: jest.fn(async () => undefined),
    };
    return session;
};

const buildRequestDoc = (overrides: Partial<Record<string, unknown>> = {}) => {
    const requestId = new mongoose.Types.ObjectId();
    const requestedBy = new mongoose.Types.ObjectId();

    return {
        _id: requestId,
        requestType: 'brand',
        categoryId: new mongoose.Types.ObjectId(),
        parentBrandId: null,
        requestedName: 'Pixel',
        canonicalName: 'pixel',
        normalizedName: 'pixel',
        requestedBy,
        status: 'pending',
        approvedEntityId: null,
        duplicateOfEntityId: null,
        rejectionReason: null,
        adminNotes: null,
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        save: jest.fn(async () => undefined),
        ...overrides,
    } as any;
};

describe('catalogRequestApprovalService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockInvalidateCatalogCache.mockResolvedValue(undefined);
        mockNotifySellersOfApproval.mockResolvedValue(undefined);
    });

    it('approves brand requests and relinks waiting ads', async () => {
        const session = buildSession();
        mockGetUserConnection.mockReturnValue({
            startSession: jest.fn(async () => session),
        });

        const requestDoc = buildRequestDoc();
        const createdBrandId = new mongoose.Types.ObjectId();

        mockCatalogRequestFindById.mockReturnValue({
            session: jest.fn().mockResolvedValue(requestDoc),
        });
        mockCategoryFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue({ _id: requestDoc.categoryId }),
        });
        mockBrandFindOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
        mockBrandCreate.mockResolvedValue([{ _id: createdBrandId }]);
        mockAdDistinct.mockReturnValue({ session: jest.fn().mockResolvedValue([]) });
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 2 });

        const result = await approveCatalogRequest({
            requestId: requestDoc._id.toString(),
            adminId: new mongoose.Types.ObjectId().toString(),
            adminNotes: 'Approved by catalog team',
        });

        expect(result.resolvedEntityId.toString()).toBe(createdBrandId.toString());
        expect(result.createdCanonicalEntity).toBe(true);
        expect(result.updatedAdsCount).toBe(2);
        expect(mockBrandCreate).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Pixel',
                    displayName: 'Pixel',
                    canonicalName: 'pixel',
                }),
            ],
            expect.any(Object)
        );
        expect(requestDoc.status).toBe('approved');
        expect(requestDoc.approvedEntityId.toString()).toBe(createdBrandId.toString());
        expect(mockInvalidateCatalogCache).toHaveBeenCalledTimes(1);
        expect(mockAdUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                catalogRequestId: requestDoc._id,
                catalogPending: true,
            }),
            { $set: expect.objectContaining({ brandId: createdBrandId, catalogPending: false }) },
            expect.objectContaining({ session })
        );
    });

    it('marks model requests as duplicate and relinks waiting ads to existing canonical model', async () => {
        const session = buildSession();
        mockGetUserConnection.mockReturnValue({
            startSession: jest.fn(async () => session),
        });

        const parentBrandId = new mongoose.Types.ObjectId();
        const duplicateModelId = new mongoose.Types.ObjectId();
        const requestDoc = buildRequestDoc({
            requestType: 'model',
            parentBrandId,
            requestedName: 'Galaxy S24',
            normalizedName: 'galaxy s24',
        });

        const duplicateModelDoc = {
            _id: duplicateModelId,
            brandId: parentBrandId,
            approvalStatus: 'approved',
            isActive: true,
            status: 'active',
            save: jest.fn(async () => undefined),
        };

        mockCatalogRequestFindById.mockReturnValue({
            session: jest.fn().mockResolvedValue(requestDoc),
        });
        mockAdDistinct.mockReturnValue({ session: jest.fn().mockResolvedValue([]) });
        mockModelFindOne.mockReturnValue({ session: jest.fn().mockResolvedValue(duplicateModelDoc) });
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 3 });

        const result = await markCatalogRequestDuplicate({
            requestId: requestDoc._id.toString(),
            adminId: new mongoose.Types.ObjectId().toString(),
            duplicateOfEntityId: duplicateModelId.toString(),
            adminNotes: 'Duplicate confirmed',
        });

        expect(result.createdCanonicalEntity).toBe(false);
        expect(result.updatedAdsCount).toBe(3);
        expect(requestDoc.status).toBe('duplicate');
        expect(requestDoc.duplicateOfEntityId.toString()).toBe(duplicateModelId.toString());
        expect(mockInvalidateCatalogCache).toHaveBeenCalledTimes(1);
        expect(mockAdUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({ catalogRequestId: requestDoc._id }),
            {
                $set: expect.objectContaining({
                    modelId: duplicateModelId,
                    brandId: parentBrandId,
                    catalogPending: false,
                }),
            },
            expect.objectContaining({ session })
        );
    });

    it('rejects pending requests without mutating waiting ads', async () => {
        const session = buildSession();
        mockGetUserConnection.mockReturnValue({
            startSession: jest.fn(async () => session),
        });

        const requestDoc = buildRequestDoc();

        mockCatalogRequestFindById.mockReturnValue({
            session: jest.fn().mockResolvedValue(requestDoc),
        });

        const result = await rejectCatalogRequest({
            requestId: requestDoc._id.toString(),
            adminId: new mongoose.Types.ObjectId().toString(),
            rejectionReason: 'Name is ambiguous',
            adminNotes: 'Ask user for complete name',
        });

        expect(result.request.status).toBe('rejected');
        expect(result.request.rejectionReason).toBe('Name is ambiguous');
        expect(mockAdUpdateMany).not.toHaveBeenCalled();
        expect(mockInvalidateCatalogCache).not.toHaveBeenCalled();
    });

    it('approves model requests and creates canonical model using requested name', async () => {
        const session = buildSession();
        mockGetUserConnection.mockReturnValue({
            startSession: jest.fn(async () => session),
        });

        const parentBrandId = new mongoose.Types.ObjectId();
        const createdModelId = new mongoose.Types.ObjectId();
        const requestDoc = buildRequestDoc({
            requestType: 'model',
            parentBrandId,
            requestedName: 'Galaxy S24 Ultra',
            normalizedName: 'galaxy s24 ultra',
            canonicalName: 'galaxy s24 ultra',
        });

        mockCatalogRequestFindById.mockReturnValue({
            session: jest.fn().mockResolvedValue(requestDoc),
        });
        mockCategoryFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue({ _id: requestDoc.categoryId }),
        });
        mockBrandFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue({ _id: parentBrandId }),
        });
        mockModelFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(null),
        });
        mockModelCreate.mockResolvedValue([{ _id: createdModelId }]);
        mockAdDistinct.mockReturnValue({ session: jest.fn().mockResolvedValue([]) });
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 1 });

        const result = await approveCatalogRequest({
            requestId: requestDoc._id.toString(),
            adminId: new mongoose.Types.ObjectId().toString(),
        });

        expect(result.resolvedEntityId.toString()).toBe(createdModelId.toString());
        expect(result.createdCanonicalEntity).toBe(true);
        expect(mockModelCreate).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    name: 'Galaxy S24 Ultra',
                    displayName: 'Galaxy S24 Ultra',
                    canonicalName: 'galaxy s24 ultra',
                }),
            ],
            expect.any(Object)
        );
        expect(mockInvalidateCatalogCache).toHaveBeenCalledTimes(1);
    });

    it('rejects model approval when parent brand is inactive or missing', async () => {
        const session = buildSession();
        mockGetUserConnection.mockReturnValue({
            startSession: jest.fn(async () => session),
        });

        const parentBrandId = new mongoose.Types.ObjectId();
        const requestDoc = buildRequestDoc({
            requestType: 'model',
            parentBrandId,
            requestedName: 'Galaxy S25',
            normalizedName: 'galaxy s25',
            canonicalName: 'galaxy s25',
        });

        mockCatalogRequestFindById.mockReturnValue({
            session: jest.fn().mockResolvedValue(requestDoc),
        });
        mockCategoryFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue({ _id: requestDoc.categoryId }),
        });
        mockBrandFindOne.mockReturnValue({
            session: jest.fn().mockResolvedValue(null),
        });

        await expect(
            approveCatalogRequest({
                requestId: requestDoc._id.toString(),
                adminId: new mongoose.Types.ObjectId().toString(),
            })
        ).rejects.toMatchObject({
            code: 'CATALOG_REQUEST_PARENT_BRAND_INACTIVE',
        });
    });
});
