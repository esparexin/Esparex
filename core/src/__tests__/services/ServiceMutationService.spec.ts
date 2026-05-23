jest.mock('@esparex/core/services/service/ServiceMutationRepository', () => ({
    findServiceForUpdate: jest.fn(),
    updateServiceByOwner: jest.fn(),
}));

jest.mock('@esparex/core/services/ListingMutationService', () => ({
    ListingMutationService: {
        processIncomingImages: jest.fn(),
        cleanupRemovedImages: jest.fn(),
    },
}));

jest.mock('@esparex/core/services/AdOrchestrator', () => ({
    createAd: jest.fn(),
}));

jest.mock('@esparex/core/services/catalog/CatalogValidationService', () => ({
    getCategorySelectionMode: jest.fn(),
    validateBrandBelongsToCategory: jest.fn(),
    validateServiceCategoryCapability: jest.fn(),
}));

jest.mock('@esparex/core/services/lifecycle/StatusMutationService', () => ({
    mutateStatus: jest.fn(),
}));

jest.mock('@esparex/core/utils/masterDataResolver', () => ({
    resolveMasterDataIds: jest.fn(),
}));

jest.mock('@esparex/core/utils/serviceTypeResolver', () => ({
    resolveServiceTypes: jest.fn(),
}));

jest.mock('@esparex/core/utils/logger', () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
    },
}));

import mongoose from 'mongoose';
import {
    findServiceForUpdate,
    updateServiceByOwner,
} from '../../services/service/ServiceMutationRepository';
import { ListingMutationService } from '../../services/ListingMutationService';
import * as AdOrchestrator from '../../services/AdOrchestrator';
import {
    getCategorySelectionMode,
    validateServiceCategoryCapability,
} from '../../services/catalog/CatalogValidationService';
import { resolveMasterDataIds } from '../../utils/masterDataResolver';
import { resolveServiceTypes } from '../../utils/serviceTypeResolver';
import { BUSINESS_STATUS } from '@esparex/shared';
import {
    createServiceMutation,
    type ServiceBusinessContext,
    updateServiceMutation,
} from '../../services/service/ServiceMutationService';

const mockedFindServiceForUpdate = findServiceForUpdate as jest.Mock;
const mockedUpdateServiceByOwner = updateServiceByOwner as jest.Mock;
const mockedResolveMasterDataIds = resolveMasterDataIds as jest.Mock;
const mockedResolveServiceTypes = resolveServiceTypes as jest.Mock;
const mockedGetCategorySelectionMode = getCategorySelectionMode as jest.Mock;
const mockedValidateServiceCategoryCapability = validateServiceCategoryCapability as jest.Mock;
const mockedAdOrchestrator = AdOrchestrator as unknown as {
    createAd: jest.Mock;
};
const mockedListingMutationService = ListingMutationService as unknown as {
    processIncomingImages: jest.Mock;
    cleanupRemovedImages: jest.Mock;
};

const makeUser = () => ({
    _id: new mongoose.Types.ObjectId(),
    role: 'user',
});

const makeBusiness = (overrides: Partial<ServiceBusinessContext> = {}): ServiceBusinessContext => ({
    _id: new mongoose.Types.ObjectId(),
    status: BUSINESS_STATUS.LIVE,
    locationId: new mongoose.Types.ObjectId(),
    location: {
        address: 'Test Address',
        locationId: new mongoose.Types.ObjectId().toString(),
    },
    ...overrides,
});

beforeEach(() => {
    jest.clearAllMocks();

    mockedResolveMasterDataIds.mockResolvedValue({
        categoryId: new mongoose.Types.ObjectId(),
        brandId: new mongoose.Types.ObjectId(),
        modelId: new mongoose.Types.ObjectId(),
    });
    mockedResolveServiceTypes.mockResolvedValue({
        serviceTypeIds: [new mongoose.Types.ObjectId()],
    });
    mockedGetCategorySelectionMode.mockResolvedValue('multiple');
    mockedValidateServiceCategoryCapability.mockResolvedValue({ ok: true });
    mockedListingMutationService.processIncomingImages.mockResolvedValue([]);
});

describe('ServiceMutationService', () => {
    it('rejects legacy serviceTypes payloads before create transaction', async () => {
        await expect(
            createServiceMutation({
                user: makeUser(),
                business: makeBusiness(),
                body: {
                    title: 'Mobile repair service',
                    description: 'Full board-level diagnostics and repair for damaged devices.',
                    categoryId: new mongoose.Types.ObjectId().toString(),
                    serviceTypes: ['Screen Replacement'],
                },
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            code: 'LEGACY_SERVICE_TYPES_ALIAS',
            details: [expect.objectContaining({ field: 'serviceTypes' })],
        });

        expect(mockedResolveServiceTypes).not.toHaveBeenCalled();
        expect(mockedAdOrchestrator.createAd).not.toHaveBeenCalled();
    });

    it('throws BUSINESS_LOCATION_REQUIRED before create transaction when business has no location', async () => {
        await expect(
            createServiceMutation({
                user: makeUser(),
                business: makeBusiness({ locationId: undefined, location: undefined }),
                body: {
                    title: 'Mobile repair service',
                    description: 'Full board-level diagnostics and repair for damaged devices.',
                    categoryId: new mongoose.Types.ObjectId().toString(),
                    serviceTypeIds: [new mongoose.Types.ObjectId().toString()],
                },
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            code: 'BUSINESS_LOCATION_REQUIRED',
            details: [expect.objectContaining({ field: 'location' })],
        });

        expect(mockedAdOrchestrator.createAd).not.toHaveBeenCalled();
    });

    it('throws LOCKED_FIELDS before persistence when immutable service fields are patched', async () => {
        mockedFindServiceForUpdate.mockResolvedValue({
            _id: new mongoose.Types.ObjectId(),
            categoryId: new mongoose.Types.ObjectId(),
            brandId: new mongoose.Types.ObjectId(),
            status: 'pending',
            images: ['https://cdn.example.com/one.jpg'],
        });

        await expect(
            updateServiceMutation({
                serviceId: new mongoose.Types.ObjectId().toString(),
                user: makeUser(),
                business: makeBusiness(),
                body: {
                    categoryId: new mongoose.Types.ObjectId().toString(),
                    title: 'Updated title',
                },
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            code: 'LOCKED_FIELDS',
            details: [expect.objectContaining({ field: 'categoryId' })],
        });

        expect(mockedUpdateServiceByOwner).not.toHaveBeenCalled();
    });

    it('rejects legacy serviceTypes payloads before update persistence', async () => {
        mockedFindServiceForUpdate.mockResolvedValue({
            _id: new mongoose.Types.ObjectId(),
            categoryId: new mongoose.Types.ObjectId(),
            brandId: new mongoose.Types.ObjectId(),
            status: 'pending',
            images: ['https://cdn.example.com/one.jpg'],
        });

        await expect(
            updateServiceMutation({
                serviceId: new mongoose.Types.ObjectId().toString(),
                user: makeUser(),
                business: makeBusiness(),
                body: {
                    title: 'Updated title',
                    serviceTypes: ['Screen Replacement'],
                },
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            code: 'LEGACY_SERVICE_TYPES_ALIAS',
            details: [expect.objectContaining({ field: 'serviceTypes' })],
        });

        expect(mockedResolveServiceTypes).not.toHaveBeenCalled();
        expect(mockedUpdateServiceByOwner).not.toHaveBeenCalled();
    });
});
