"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const User_1 = __importDefault(require("@core/models/User"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Category_1 = __importDefault(require("@core/models/Category"));
const ServiceType_1 = __importDefault(require("@core/models/ServiceType"));
const SparePart_1 = __importDefault(require("@core/models/SparePart"));
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const moderationStatus_1 = require("@core/constants/enums/moderationStatus");
const mobileVisibility_1 = require("@shared/constants/mobileVisibility");
const logger_1 = __importDefault(require("@core/utils/logger"));
const BUYER_MOBILE = (process.env.SMOKE_AUTH_MOBILE || '9030787819').trim();
const SELLER_MOBILE = (process.env.SMOKE_FIXTURE_SELLER_MOBILE || '9030787820').trim();
const OUTPUT_PATH = (process.env.SMOKE_FIXTURE_OUTPUT_PATH || '').trim();
const REVEAL_EXPECTATION = ((process.env.SMOKE_FIXTURE_REVEAL_EXPECT || 'mobile').trim().toLowerCase()
    .replace(/phone_request_required/g, 'request_only'));
const FIXTURE_IDS = {
    ad: new mongoose_1.Types.ObjectId('6a7d4b9f3e2c1a0b4d5e6f70'),
    service: new mongoose_1.Types.ObjectId('6a7d4b9f3e2c1a0b4d5e6f71'),
    spare_part: new mongoose_1.Types.ObjectId('6a7d4b9f3e2c1a0b4d5e6f72'),
};
const FIXTURE_TITLES = {
    ad: 'Smoke Fixture Ad Listing',
    service: 'Smoke Fixture Service Listing',
    spare_part: 'Smoke Fixture Spare Part Listing',
};
const FIXTURE_SLUGS = {
    ad: 'smoke-fixture-ad-6a7d4b9f3e2c1a0b4d5e6f70',
    service: 'smoke-fixture-service-6a7d4b9f3e2c1a0b4d5e6f71',
    spare_part: 'smoke-fixture-spare-part-6a7d4b9f3e2c1a0b4d5e6f72',
};
const LISTING_BASE_PATH = {
    ad: '/ads',
    service: '/services',
    spare_part: '/spare-part-listings',
};
const SUPPORTED_REVEAL_EXPECTATIONS = new Set([
    'mobile',
    'masked',
    'request_only',
    'hidden',
]);
const FIXTURE_LOCATION = {
    address: 'Smoke Fixture Market Road',
    city: 'Macherla',
    state: 'Andhra Pradesh',
    country: 'India',
    display: 'Macherla, Andhra Pradesh',
    coordinates: {
        type: 'Point',
        coordinates: [79.4399, 16.4742],
    },
};
function getRevealVisibility(expectation) {
    switch (expectation) {
        case 'hidden':
            return mobileVisibility_1.MOBILE_VISIBILITY.HIDE;
        case 'request_only':
            return mobileVisibility_1.MOBILE_VISIBILITY.ON_REQUEST;
        case 'mobile':
        case 'masked':
        default:
            return mobileVisibility_1.MOBILE_VISIBILITY.SHOW;
    }
}
function getFixturePath(type) {
    return `${LISTING_BASE_PATH[type]}/${FIXTURE_SLUGS[type]}-${FIXTURE_IDS[type].toString()}`;
}
async function ensureUser(params) {
    const update = {
        mobile: params.mobile,
        name: params.name,
        email: `${params.mobile}@smoke.local`,
        isPhoneVerified: true,
        isEmailVerified: false,
        isVerified: true,
        status: 'live',
        role: 'user',
        mobileVisibility: params.mobileVisibility || mobileVisibility_1.MOBILE_VISIBILITY.SHOW,
        location: {
            city: FIXTURE_LOCATION.city,
            state: FIXTURE_LOCATION.state,
            coordinates: FIXTURE_LOCATION.coordinates,
        },
        isDeleted: false,
        deletedAt: undefined,
    };
    const user = await User_1.default.findOneAndUpdate({ mobile: params.mobile }, { $set: update, $unset: { lockUntil: '', deletedAt: '' } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    if (!user) {
        throw new Error(`Failed to ensure user for mobile ${params.mobile}`);
    }
    return user;
}
async function resolveCategoryFor(type) {
    const typeSelector = type === 'ad'
        ? {
            $or: [
                { listingType: listingType_1.LISTING_TYPE.AD },
                { listingType: { $exists: false } },
                { listingType: { $size: 0 } },
                { type: 'ad' },
            ],
        }
        : {
            $or: [
                { listingType: type },
                { type },
            ],
        };
    const category = await Category_1.default.findOne({
        isDeleted: { $ne: true },
        isActive: true,
        status: { $in: ['live', 'active'] },
        ...typeSelector,
    })
        .sort({ updatedAt: -1 })
        .select('_id name slug serviceSelectionMode')
        .lean();
    if (!category) {
        throw new Error(`No active category found for listingType=${type}`);
    }
    return category;
}
async function resolveServiceType(categoryId) {
    const serviceType = await ServiceType_1.default.findOne({
        isDeleted: { $ne: true },
        isActive: true,
        categoryIds: categoryId,
    })
        .sort({ updatedAt: -1 })
        .select('_id name')
        .lean();
    if (!serviceType) {
        throw new Error(`No active service type found for category ${categoryId.toString()}`);
    }
    return serviceType;
}
async function resolveSparePart(categoryId) {
    const sparePart = await SparePart_1.default.findOne({
        isDeleted: { $ne: true },
        isActive: true,
        categoryIds: categoryId,
        listingType: listingType_1.LISTING_TYPE.SPARE_PART,
    })
        .sort({ updatedAt: -1 })
        .select('_id name slug')
        .lean();
    if (!sparePart) {
        throw new Error(`No active spare part found for category ${categoryId.toString()}`);
    }
    return sparePart;
}
function buildBaseListingDocument(params) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 45);
    return {
        _id: FIXTURE_IDS[params.type],
        title: FIXTURE_TITLES[params.type],
        description: `Local smoke fixture for ${params.type} detail contact flows.`,
        price: params.type === 'service' ? 299 : 999,
        currency: 'INR',
        categoryId: params.categoryId,
        listingType: params.type,
        sellerId: params.sellerId,
        sellerType: 'user',
        status: listingStatus_1.LISTING_STATUS.LIVE,
        moderationStatus: moderationStatus_1.MODERATION_STATUS.MANUAL_APPROVED,
        seoSlug: FIXTURE_SLUGS[params.type],
        location: FIXTURE_LOCATION,
        locationPath: [],
        views: {
            total: 0,
            unique: 0,
            favorites: 0,
            chats: 0,
        },
        images: [],
        isSpotlight: false,
        isChatLocked: false,
        sellerTrustSnapshot: 50,
        listingQualityScore: 40,
        freshnessScore: 0,
        publishedAt: now,
        approvedAt: now,
        expiresAt,
        isDeleted: false,
    };
}
async function ensureAdFixture(categoryId, sellerId) {
    const document = buildBaseListingDocument({ type: listingType_1.LISTING_TYPE.AD, categoryId, sellerId });
    await Ad_1.default.findOneAndUpdate({ _id: FIXTURE_IDS.ad }, {
        $set: document,
        $unset: {
            brandId: '',
            modelId: '',
            serviceTypeIds: '',
            sparePartId: '',
            sparePartIds: '',
            businessId: '',
        },
    }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
}
async function ensureServiceFixture(categoryId, sellerId) {
    const serviceType = await resolveServiceType(categoryId);
    const document = buildBaseListingDocument({ type: listingType_1.LISTING_TYPE.SERVICE, categoryId, sellerId });
    await Ad_1.default.findOneAndUpdate({ _id: FIXTURE_IDS.service }, {
        $set: {
            ...document,
            title: FIXTURE_TITLES.service,
            price: 0,
            priceMin: 299,
            priceMax: 799,
            diagnosticFee: 99,
            onsiteService: true,
            turnaroundTime: '24 hours',
            serviceTypeIds: [serviceType._id],
        },
        $unset: {
            brandId: '',
            modelId: '',
            sparePartId: '',
            sparePartIds: '',
            businessId: '',
        },
    }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
}
async function ensureSparePartFixture(categoryId, sellerId) {
    const sparePart = await resolveSparePart(categoryId);
    const document = buildBaseListingDocument({ type: listingType_1.LISTING_TYPE.SPARE_PART, categoryId, sellerId });
    await Ad_1.default.findOneAndUpdate({ _id: FIXTURE_IDS.spare_part }, {
        $set: {
            ...document,
            title: FIXTURE_TITLES.spare_part,
            price: 499,
            sparePartId: sparePart._id,
            sparePartIds: [sparePart._id],
            stock: 3,
            condition: 'new',
        },
        $unset: {
            brandId: '',
            modelId: '',
            serviceTypeIds: '',
            businessId: '',
        },
    }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
}
function verifyOwnershipSeparation(buyerMobile, sellerMobile) {
    if (buyerMobile === sellerMobile) {
        throw new Error(`SMOKE_AUTH_MOBILE (${buyerMobile}) and SMOKE_FIXTURE_SELLER_MOBILE (${sellerMobile}) must be different.`);
    }
}
async function run() {
    try {
        if (!SUPPORTED_REVEAL_EXPECTATIONS.has(REVEAL_EXPECTATION)) {
            throw new Error(`Unsupported SMOKE_FIXTURE_REVEAL_EXPECT value "${REVEAL_EXPECTATION}". ` +
                `Use one of: ${Array.from(SUPPORTED_REVEAL_EXPECTATIONS).join(', ')}.`);
        }
        verifyOwnershipSeparation(BUYER_MOBILE, SELLER_MOBILE);
        await (0, db_1.connectDB)();
        const buyer = await ensureUser({
            mobile: BUYER_MOBILE,
            name: 'Smoke Fixture Buyer',
            mobileVisibility: mobileVisibility_1.MOBILE_VISIBILITY.SHOW,
        });
        const seller = await ensureUser({
            mobile: SELLER_MOBILE,
            name: 'Smoke Fixture Seller',
            mobileVisibility: getRevealVisibility(REVEAL_EXPECTATION),
        });
        if (buyer.id === seller.id) {
            throw new Error('Smoke buyer and seller resolved to the same user document.');
        }
        const adCategory = await resolveCategoryFor('ad');
        const serviceCategory = await resolveCategoryFor('service');
        const sparePartCategory = await resolveCategoryFor('spare_part');
        await ensureAdFixture(adCategory._id, seller._id);
        await ensureServiceFixture(serviceCategory._id, seller._id);
        await ensureSparePartFixture(sparePartCategory._id, seller._id);
        const smokeFixtures = {
            chat: {
                ad: { path: getFixturePath('ad') },
                service: { path: getFixturePath('service') },
                spare_part: { path: getFixturePath('spare_part') },
            },
            reveal: {
                path: getFixturePath('ad'),
                expect: REVEAL_EXPECTATION,
            },
        };
        const json = JSON.stringify(smokeFixtures);
        if (OUTPUT_PATH) {
            fs_1.default.writeFileSync(OUTPUT_PATH, json, 'utf8');
        }
        process.stdout.write(`${json}\n`);
        process.stdout.write(`SMOKE_LISTING_FIXTURES='${json}'\n`);
        process.stdout.write(`SMOKE_AUTH_MOBILE='${BUYER_MOBILE}'\n`);
        logger_1.default.info('Listing smoke fixtures ensured', {
            buyerMobile: BUYER_MOBILE,
            sellerMobile: SELLER_MOBILE,
            revealExpectation: REVEAL_EXPECTATION,
            adPath: smokeFixtures.chat.ad.path,
            servicePath: smokeFixtures.chat.service.path,
            sparePartPath: smokeFixtures.chat.spare_part.path,
        });
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Failed to ensure listing smoke fixtures', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
}
void run();
//# sourceMappingURL=ensure-listing-smoke-fixtures.js.map