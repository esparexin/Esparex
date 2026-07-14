// Esparex Shared Package Entry Point
// Export common schemas, enums, constants and utilities

// SCHEMAS
export * from './schemas/common.schemas';
export * from './schemas/catalog.schema';
export * from './schemas/location.schema';
export * from './schemas/savedSearch.schema';
export * from './schemas/smartAlert.schema';
export * from './schemas/text.schema';
export * from './schemas/adPayload.schema';
export * from './schemas/servicePayload.schema';
export * from './schemas/planPayload.schema';
export * from './schemas/sparePartPayload.schema';
export * from './schemas/ad.schema';

// ENUMS
export * from './enums/actor';
export * from './enums/adStatus';
export * from './enums/apiKeyStatus';
export * from './enums/businessStatus';
export * from './enums/catalogStatus';
export * from './enums/chatStatus';
export * from './enums/idProofType';
export * from './enums/inventoryStatus';
export * from './enums/lifecycle';
export * from './enums/listingStatus';
export * from './enums/listingType';
export * from './enums/locationStatus';
export * from './enums/moderationStatus';
export * from './enums/notificationType';
export * from './enums/paymentStatus';
export * from './enums/physicalStatus';
export * from './enums/planStatus';
export * from './enums/reportReason';
export * from './enums/reportStatus';
export * from './enums/requestStatus';
export * from './enums/roles';
export * from './enums/serviceStatus';
export * from './enums/serviceType';
export * from './enums/catalogApprovalStatus';
export * from './enums/userStatus';

// CONSTANTS
export {
    AD_LIMITS,
    MIN_AD_IMAGES,
    MAX_AD_IMAGES,
    MAX_AD_IMAGE_BYTES,
    MIN_AD_TITLE_CHARS,
    MAX_AD_TITLE_CHARS,
    MIN_AD_DESCRIPTION_CHARS,
    MAX_AD_DESCRIPTION_CHARS,
    MAX_AD_SPARE_PARTS,
} from './constants/adLimits';
export * from './constants/bannedWords';
export * from './constants/fieldLimits';
export * from './constants/notificationRetention';
export * from './constants/adminNotificationTargets';
export * from './constants/mobileVisibility';
export * from './constants/locationEvents';

// UTILS
export * from './utils/formatters';
export * from './utils/statusNormalization';
export * from './utils/userStatus';
export * from './utils/categoryFilters';
export * from './utils/securityPatterns';
export * from './utils/resolveCategoryId';
export * from './utils/geoUtils';
export * from './utils/locationPrimitives';
export * from './utils/textValidator';
export * from './utils/catalogNamingValidator';
export * from './utils/planEntitlements';
export * from './listingUtils/locationUtils';
export * from './listingUtils/imageUtils';
export { adaptLocationInput } from './location/location.utils';

// POPUP
export * from './popup/popupCore';
export * from './popup/popupEvents';
export * from './popup/popupQueue';

// CONTRACTS (API & Shared)
export * from './contracts/api/basePaths';
export * from './contracts/api/userRoutes';
export * from './contracts/api/adminRoutes';
export * from './contracts/api/resourceNames';
export * from './contracts/chat.contracts';

// TYPES
export * from './types/api';
// export * from './types/ad'; // Conflict: Ad already in schemas/ad.schema
export type { AdLocation } from './types/ad';
export * from './types/user';
export * from './types/common';
export * from './types/plan';
export * from './types/business';
export * from './types/service';
export * from './types/catalogHierarchy';
export {
    type Location,
    type LocationLevel,
    type GeoJSONPoint,
    type CanonicalGeoPoint,
    type ListingLocation
} from './types/location';

// OBSERVABILITY
export * from './observability/trace';
export * from './observability/types';
export { getLogger } from './observability/index';
export { createUniversalLogger } from './observability/logger';

// IMAGE DOMAIN REGISTRY
import * as imageDomainRegistry from './constants/image-domain-registry.json';
export { imageDomainRegistry };
export default imageDomainRegistry;
