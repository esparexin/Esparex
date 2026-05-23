/**
 * AdCreationService — Unit Tests
 * 
 * Strategy:
 *   AdCreationService.preparePayload is the core engine for normalizing and 
 *   enriching listing data before persistence. It handles complex lookups 
 *   (catalog, location, spare parts), sanitization, image processing, 
 *   and moderation defaults.
 * 
 *   We mock all external dependencies (Models, Catalog Services, Utils) 
 *   to verify that the preparation logic correctly coordinates these 
 *   components and enforces business rules.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models/Ad', () => ({
    __esModule: true,
    default: {
        countDocuments: jest.fn(),
    },
}));

jest.mock('../../models/SparePart', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn(),
            }),
        }),
    },
}));

jest.mock('../../models/Brand', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn(),
            }),
        }),
    },
}));

// Dynamic Import Mocks
jest.mock('../../services/SparePartListingService', () => ({
    generateUniqueSparePartSlug: jest.fn().mockResolvedValue('unique-spare-part-slug'),
}), { virtual: true });

jest.mock('../../utils/serviceQuality', () => ({
    calculateServiceQuality: jest.fn().mockReturnValue(85),
}), { virtual: true });

// Util Mocks
jest.mock('../../services/location/LocationNormalizer', () => ({
    normalizeLocation: jest.fn(),
}));

jest.mock('@esparex/shared', () => {
    const originalModule = jest.requireActual('@esparex/shared');
    return {
        ...originalModule,
        normalizeGeoPoint: jest.fn((coords) => coords),
        TraceContext: {
            getCorrelationId: jest.fn().mockReturnValue('mock-correlation-id'),
        },
    };
});

jest.mock('../../utils/categoryCanonical', () => ({
    resolveEquivalentActiveCategoryIds: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../utils/slugGenerator', () => ({
    generateUniqueSlug: jest.fn().mockResolvedValue('unique-listing-slug'),
}));

jest.mock('../../utils/locationHierarchy', () => ({
    resolveLocationPathIds: jest.fn().mockResolvedValue(['loc-1', 'loc-2']),
}));

jest.mock('../../utils/imageProcessor', () => ({
    processImages: jest.fn(),
}));

jest.mock('../../utils/s3', () => ({
    sanitizeStoredImageUrls: jest.fn((urls) => urls),
}));

jest.mock('../../services/lifecycle/AdStatusService', () => ({
    computeActiveExpiry: jest.fn().mockResolvedValue(new Date(Date.now() + 30 * 86400000)),
}));

jest.mock('../../config/featureFlags', () => ({
    FeatureFlag: { ENABLE_SPAREPARTS_SNAPSHOT: 'ENABLE_SPAREPARTS_SNAPSHOT' },
    isEnabled: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../utils/adQualityScorer', () => ({
    computeListingQualityScore: jest.fn().mockReturnValue(90),
}));

jest.mock('../../services/catalog/CatalogValidationService', () => ({
    validateBrandBelongsToCategory: jest.fn().mockResolvedValue({ ok: true }),
    validateModelBelongsToBrand: jest.fn().mockResolvedValue({ ok: true }),
    validateListingCategoryCapability: jest.fn().mockResolvedValue({ ok: true }),
    getCategorySelectionMode: jest.fn().mockResolvedValue('multi'),
}));

jest.mock('../../utils/serviceTypeResolver', () => ({
    resolveServiceTypes: jest.fn().mockResolvedValue({
        serviceTypeIds: ['60b9b0b9b0b9b0b9b0b9b0b5']
    }),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import { AdCreationService } from '../../services/AdCreationService';
import { normalizeLocation } from '../../services/location/LocationNormalizer';
import { generateUniqueSlug } from '../../utils/slugGenerator';
import { processImages } from '../../utils/imageProcessor';
import { validateListingCategoryCapability } from '../../services/catalog/CatalogValidationService';
import { AdContext } from '../../types/ad.types';
import { LIFECYCLE_STATUS } from '@esparex/shared';
import { LISTING_TYPE } from '@esparex/shared';
import SparePart from '../../models/SparePart';
import Brand from '../../models/Brand';

// ── Typed Mocks ──────────────────────────────────────────────────────────────

const mockNormalizeLocation = normalizeLocation as jest.Mock;
const mockGenerateUniqueSlug = generateUniqueSlug as jest.Mock;
const mockProcessImages = processImages as jest.Mock;
const mockValidateListingCategoryCapability = validateListingCategoryCapability as jest.Mock;
const mockSparePartModelFind = SparePart.find as jest.Mock;
const mockBrandModelFind = Brand.find as jest.Mock;

// ── Shared Fixtures ──────────────────────────────────────────────────────────

const SELLER_ID = '60b9b0b9b0b9b0b9b0b9b0b1';
const CATEGORY_ID = '60b9b0b9b0b9b0b9b0b9b0b2';
const BRAND_ID = '60b9b0b9b0b9b0b9b0b9b0b3';
const MODEL_ID = '60b9b0b9b0b9b0b9b0b9b0b4';

const makeContext = (overrides: Partial<AdContext> = {}): AdContext => ({
    actor: 'USER',
    sellerId: SELLER_ID,
    authUserId: SELLER_ID,
    ...overrides,
});

const makeData = (overrides: Record<string, any> = {}): Record<string, any> => ({
    categoryId: CATEGORY_ID,
    brandId: BRAND_ID,
    modelId: MODEL_ID,
    title: '  Fresh iPhone 15 Pro  ', // Untrimmed with extra spaces
    description: 'Very long description that satisfies the 20 character requirement.',
    price: 999,
    location: { id: 'loc-123', name: 'New York' },
    images: ['img-1.jpg'],
    ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AdCreationService.preparePayload', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockNormalizeLocation.mockResolvedValue({
            locationId: 'loc-123',
            id: 'loc-123',
            name: 'New York',
            coordinates: [10, 20]
        });

        mockProcessImages.mockResolvedValue([
            { url: 'https://s3/img-1.jpg', thumbnailUrl: 'https://s3/thumb-1.jpg', hash: 'hash1' }
        ]);

        mockValidateListingCategoryCapability.mockResolvedValue({ ok: true });
    });

    // =========================================================================
    // HAPPY PATH: User Creation
    // =========================================================================
    it('should correctly prepare payload for a standard user ad', async () => {
        const data = makeData();
        const context = makeContext();

        const payload = await AdCreationService.preparePayload(data, context);

        // Sanitization
        expect(payload.title).toBe('Fresh iPhone 15 Pro'); // Trimmed
        
        // Defaults
        expect(payload.sellerId).toBe(SELLER_ID);
        expect(payload.status).toBe(LIFECYCLE_STATUS.PENDING);
        expect(payload.moderationStatus).toBe('held_for_review');
        expect(payload.createdAt).toBeInstanceOf(Date);
        expect(payload.updatedAt).toBeInstanceOf(Date);
        
        // Slug
        expect(payload.seoSlug).toBe('unique-listing-slug');
        expect(mockGenerateUniqueSlug).toHaveBeenCalledWith(expect.anything(), 'Fresh iPhone 15 Pro', undefined, undefined);

        // Quality Score
        expect(payload.listingQualityScore).toBe(90);
    });

    // =========================================================================
    // HAPPY PATH: Admin Creation
    // =========================================================================
    it('should correctly prepare payload for an admin created listing (Auto-Approve)', async () => {
        const data = makeData();
        const context = makeContext({ actor: 'ADMIN' });

        const payload = await AdCreationService.preparePayload(data, context);

        expect(payload.status).toBe(LIFECYCLE_STATUS.LIVE);
        expect(payload.moderationStatus).toBe('auto_approved');
        expect(payload.expiresAt).toBeDefined(); // Admin-created live ads get immediate expiry
    });

    // =========================================================================
    // VALIDATION: Sanitization & Errors
    // =========================================================================
    it('should throw error if description is too short', async () => {
        const data = makeData({ description: 'Too short' });
        const context = makeContext();

        await expect(AdCreationService.preparePayload(data, context))
            .rejects.toThrow('Description must be at least 20 characters');
    });

    it('should strip HTML tags from title and description', async () => {
        const data = makeData({
            title: '<b>Bold Title</b>',
            description: '<p>Paragraph with enough characters to pass validation.</p>'
        });
        const context = makeContext();

        const payload = await AdCreationService.preparePayload(data, context);

        expect(payload.title).toBe('Bold Title');
        expect(payload.description).toBe('Paragraph with enough characters to pass validation.');
    });

    it('should throw error if category capability validation fails', async () => {
        mockValidateListingCategoryCapability.mockResolvedValue({ ok: false, reason: 'Category full' });
        const data = makeData();
        const context = makeContext();

        await expect(AdCreationService.preparePayload(data, context))
            .rejects.toThrow('Category full');
    });

    // =========================================================================
    // BRANCH: Spare Parts Snapshots
    // =========================================================================
    it('should generate spare parts snapshot when feature is enabled', async () => {
        const partId = new mongoose.Types.ObjectId().toString();
        const data = makeData({ spareParts: [partId] });
        const context = makeContext();

        mockSparePartModelFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ 
                    _id: partId, 
                    name: 'Screen Replacement', 
                    brandId: new mongoose.Types.ObjectId(BRAND_ID) 
                }])
            })
        });

        mockBrandModelFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ 
                    _id: new mongoose.Types.ObjectId(BRAND_ID), 
                    name: 'Apple' 
                }])
            })
        });

        const payload = await AdCreationService.preparePayload(data, context);

        expect(payload.sparePartsSnapshot).toBeDefined();
        expect(payload.sparePartsSnapshot?.[0].name).toBe('Screen Replacement');
        expect(payload.sparePartsSnapshot?.[0].brand).toBe('Apple');
    });

    // =========================================================================
    // BRANCH: Image Processing
    // =========================================================================
    it('should handle image processing for service listings', async () => {
        const data = makeData({ 
            listingType: LISTING_TYPE.SERVICE,
            images: ['service-img.jpg'],
            business: {
                status: 'live',
                locationId: new mongoose.Types.ObjectId().toString(),
                location: {
                    address: 'Test Address',
                    locationId: new mongoose.Types.ObjectId().toString(),
                }
            }
        });
        const context = makeContext();

        await AdCreationService.preparePayload(data, context);

        // Verification of folder path
        expect(mockProcessImages).toHaveBeenCalledWith(
            ['service-img.jpg'],
            expect.stringMatching(/^services\//)
        );
    });

    // =========================================================================
    // SERVICE QUALITY: Specific Calculation
    // =========================================================================
    it('should use calculateServiceQuality for service listings', async () => {
        const data = makeData({ 
            listingType: LISTING_TYPE.SERVICE,
            business: {
                status: 'live',
                locationId: new mongoose.Types.ObjectId().toString(),
                location: {
                    address: 'Test Address',
                    locationId: new mongoose.Types.ObjectId().toString(),
                }
            }
        });
        const context = makeContext();

        const payload = await AdCreationService.preparePayload(data, context);

        expect(payload.listingQualityScore).toBe(85); // Value from calculateServiceQuality mock
    });
});
