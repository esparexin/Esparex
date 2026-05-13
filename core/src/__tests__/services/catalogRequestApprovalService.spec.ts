import mongoose from 'mongoose';

const mockGetUserConnection = jest.fn();
const mockCatalogRequestFindById = jest.fn();
const mockBrandFindOne = jest.fn();
const mockBrandCreate = jest.fn();
const mockModelFindOne = jest.fn();
const mockModelCreate = jest.fn();
const mockAdUpdateMany = jest.fn();

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
        updateMany: (...args: unknown[]) => mockAdUpdateMany(...args),
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
        mockBrandFindOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
        mockBrandCreate.mockResolvedValue([{ _id: createdBrandId }]);
        mockAdUpdateMany.mockResolvedValue({ modifiedCount: 2 });

        const result = await approveCatalogRequest({
            requestId: requestDoc._id.toString(),
            adminId: new mongoose.Types.ObjectId().toString(),
            adminNotes: 'Approved by catalog team',
        });

        expect(result.resolvedEntityId.toString()).toBe(createdBrandId.toString());
        expect(result.createdCanonicalEntity).toBe(true);
        expect(result.updatedAdsCount).toBe(2);
        expect(requestDoc.status).toBe('approved');
        expect(requestDoc.approvedEntityId.toString()).toBe(createdBrandId.toString());
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
    });
});
