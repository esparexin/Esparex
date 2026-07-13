import type { Request, Response } from 'express';

const mockCatalogRequestFindOne = jest.fn();
const mockCatalogRequestCreate = jest.fn();
const mockCatalogRequestFind = jest.fn();
const mockCatalogRequestCountDocuments = jest.fn();
const mockCatalogRequestAggregate = jest.fn();
const mockCatalogRequestFindById = jest.fn();

const mockValidateCategoryIsActive = jest.fn();
const mockValidateBrandBelongsToCategory = jest.fn();
const mockNotifyAdminsOfSuggestion = jest.fn();

jest.mock('@esparex/core/models/CatalogRequest', () => ({
    __esModule: true,
    default: {
        findOne: (...args: unknown[]) => mockCatalogRequestFindOne(...args),
        create: (...args: unknown[]) => mockCatalogRequestCreate(...args),
        find: (...args: unknown[]) => mockCatalogRequestFind(...args),
        countDocuments: (...args: unknown[]) => mockCatalogRequestCountDocuments(...args),
        aggregate: (...args: unknown[]) => mockCatalogRequestAggregate(...args),
        findById: (...args: unknown[]) => mockCatalogRequestFindById(...args),
        db: {
            startSession: jest.fn().mockImplementation(() => ({
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn(),
            })),
        },
    },
}));

jest.mock('@esparex/core/services/catalog/CatalogValidationService', () => ({
    __esModule: true,
    validateCategoryIsActive: (...args: unknown[]) => mockValidateCategoryIsActive(...args),
    validateBrandBelongsToCategory: (...args: unknown[]) => mockValidateBrandBelongsToCategory(...args),
    CatalogValidationService: {
        validateCatalogInput: jest.fn().mockReturnValue({ ok: true }),
    },
}));

jest.mock('@esparex/core/services/catalog/CatalogNotificationService', () => ({
    __esModule: true,
    CatalogNotificationService: {
        notifyAdminsOfSuggestion: (...args: unknown[]) => mockNotifyAdminsOfSuggestion(...args),
    },
}));

jest.mock('@esparex/core/services/catalogRequestApproval/resolvers', () => ({
    __esModule: true,
    resolveOrCreateBrand: jest.fn().mockResolvedValue({ entityId: 'resolvedBrandId', createdCanonicalEntity: true }),
    resolveOrCreateModel: jest.fn().mockResolvedValue({ entityId: 'resolvedModelId', createdCanonicalEntity: true }),
}));

jest.mock('@esparex/core/services/catalog/CatalogOrchestrator', () => ({
    __esModule: true,
    default: {
        invalidateCatalogCache: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('@esparex/core/services/catalogRequestApprovalService', () => ({
    __esModule: true,
    approveCatalogRequest: jest.fn(),
    rejectCatalogRequest: jest.fn(),
    markCatalogRequestDuplicate: jest.fn(),
}));

import {
    createCatalogRequest,
    getMyCatalogRequests,
} from '../../controllers/catalogRequestController';

const createMockRes = (req?: Partial<Request>) => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        req,
    };
    return res as unknown as Response;
};

describe('catalogRequestController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockValidateCategoryIsActive.mockResolvedValue({ ok: true });
        mockValidateBrandBelongsToCategory.mockResolvedValue({ ok: true });
        mockNotifyAdminsOfSuggestion.mockResolvedValue(undefined);
    });

    it('rejects create request when category is inactive', async () => {
        mockValidateCategoryIsActive.mockResolvedValue({
            ok: false,
            reason: 'categoryId must reference an active category.',
        });

        const req = {
            originalUrl: '/api/v1/catalog-requests',
            body: {
                requestType: 'brand',
                categoryId: '65fa29c9d2c1f2e165fa29c9',
                requestedName: 'Acme',
            },
            user: { _id: '65fa29c9d2c1f2e165fa29ca' },
        } as unknown as Request;
        const res = createMockRes(req);

        await createCatalogRequest(req, res);

        expect(mockCatalogRequestCreate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                code: 'CATALOG_REQUEST_CATEGORY_INVALID',
                error: 'categoryId must reference an active category.',
                status: 400,
            })
        );
    });

    it('rejects model request when parent brand is invalid for category', async () => {
        mockValidateBrandBelongsToCategory.mockResolvedValue({
            ok: false,
            reason: 'parentBrandId must reference an active brand in the selected category.',
        });

        const req = {
            originalUrl: '/api/v1/catalog-requests',
            body: {
                requestType: 'model',
                categoryId: '65fa29c9d2c1f2e165fa29c9',
                parentBrandId: '65fa29c9d2c1f2e165fa29cb',
                requestedName: 'Acme One',
            },
            user: { _id: '65fa29c9d2c1f2e165fa29ca' },
        } as unknown as Request;
        const res = createMockRes(req);

        await createCatalogRequest(req, res);

        expect(mockCatalogRequestCreate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                code: 'CATALOG_REQUEST_PARENT_BRAND_INVALID',
                error: 'parentBrandId must reference an active brand in the selected category.',
                status: 400,
            })
        );
    });

    it('returns paginated response with meta.pagination envelope', async () => {
        const docs = [
            { _id: '65fa29c9d2c1f2e165fa29c1', requestedName: 'Alpha' },
            { _id: '65fa29c9d2c1f2e165fa29c2', requestedName: 'Beta' },
        ];

        const limit = jest.fn().mockResolvedValue(docs);
        const skip = jest.fn().mockReturnValue({ limit });
        const sort = jest.fn().mockReturnValue({ skip });
        mockCatalogRequestFind.mockReturnValue({ sort });
        mockCatalogRequestCountDocuments.mockResolvedValue(5);

        const req = {
            originalUrl: '/api/v1/catalog-requests/my?page=2&limit=2',
            query: { page: '2', limit: '2' },
            user: { _id: '65fa29c9d2c1f2e165fa29ca' },
        } as unknown as Request;
        const res = createMockRes(req);

        await getMyCatalogRequests(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    items: expect.arrayContaining([
                        expect.objectContaining({ id: '65fa29c9d2c1f2e165fa29c1', requestedName: 'Alpha' }),
                        expect.objectContaining({ id: '65fa29c9d2c1f2e165fa29c2', requestedName: 'Beta' }),
                    ]),
                }),
                meta: expect.objectContaining({
                    pagination: expect.objectContaining({
                        page: 2,
                        limit: 2,
                        total: 5,
                        pages: 3,
                    }),
                }),
            })
        );
    });

    describe('createCatalogRequest (Decoupled Policy & Validation)', () => {
        it('returns 422 Unprocessable Entity when validation fails (REJECT decision)', async () => {
            const { CatalogValidationService } = require('@esparex/core/services/catalog/CatalogValidationService');
            CatalogValidationService.validateCatalogInput.mockReturnValueOnce({
                ok: false,
                reason: 'Keyboard mashing or repetitive characters detected.'
            });

            const req = {
                originalUrl: '/api/v1/catalog-requests',
                body: {
                    requestType: 'brand',
                    categoryId: '65fa29c9d2c1f2e165fa29c9',
                    requestedName: 'asdfasdf',
                },
                user: { _id: '65fa29c9d2c1f2e165fa29ca' },
            } as unknown as Request;
            const res = createMockRes(req);

            await createCatalogRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    decision: 'REJECT',
                    reason: 'INVALID_CATALOG_NAME',
                })
            );
        });

        it('auto-approves valid brand suggestions instantly', async () => {
            const mockSave = jest.fn().mockResolvedValue(undefined);
            const mockCreatedDoc = {
                _id: '65fa29c9d2c1f2e165fa29c5',
                requestedName: 'Lava',
                save: mockSave
            };
            mockCatalogRequestCreate.mockResolvedValueOnce([mockCreatedDoc]);

            const req = {
                originalUrl: '/api/v1/catalog-requests',
                body: {
                    requestType: 'brand',
                    categoryId: '65fa29c9d2c1f2e165fa29c9',
                    requestedName: 'Lava',
                },
                user: { _id: '65fa29c9d2c1f2e165fa29ca' },
            } as unknown as Request;
            const res = createMockRes(req);

            await createCatalogRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        approvedEntityId: 'resolvedBrandId',
                        decision: 'AUTO_APPROVE',
                        created: true
                    })
                })
            );
        });

        it('aborts transaction and rolls back when resolver fails', async () => {
            const { resolveOrCreateBrand } = require('@esparex/core/services/catalogRequestApproval/resolvers');
            resolveOrCreateBrand.mockRejectedValueOnce(new Error('Mongoose write collision'));

            const abortTransaction = jest.fn();
            const startTransaction = jest.fn();
            const endSession = jest.fn();
            const startSession = jest.fn().mockImplementation(() => ({
                startTransaction,
                commitTransaction: jest.fn(),
                abortTransaction,
                endSession
            }));
            
            const CatalogRequest = require('@esparex/core/models/CatalogRequest').default;
            CatalogRequest.db.startSession = startSession;

            const req = {
                originalUrl: '/api/v1/catalog-requests',
                body: {
                    requestType: 'brand',
                    categoryId: '65fa29c9d2c1f2e165fa29c9',
                    requestedName: 'Lava',
                },
                user: { _id: '65fa29c9d2c1f2e165fa29ca' },
            } as unknown as Request;
            const res = createMockRes(req);

            await createCatalogRequest(req, res);

            expect(abortTransaction).toHaveBeenCalled();
            expect(endSession).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
