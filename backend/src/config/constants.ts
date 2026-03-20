export const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const GOVERNANCE = {
    AD: {
        EXPIRY_DAYS: 30, // Locked policy: 30 days
        MAX_IMAGES: 6,
        MIN_IMAGES: 1,
        MIN_TITLE_LENGTH: 10,
        MAX_TITLE_LENGTH: 60,
        MIN_DESCRIPTION_LENGTH: 20,
        MAX_DESCRIPTION_CHARS: 500,
        SPARE_PARTS_MAX: 20
    },
    BUSINESS: {
        SERVICE_RADIUS_KM: 100, // Maximum allowed service radius
        SEARCH_RADIUS_KM: 500, // Maximum user search radius
        EXPIRY_DAYS: 365, // Business validity 1 year
        AUTO_EXPIRE_CHECK_DAYS: 30 // Check expiry 30 days before
    },
    CONTENT: {
        EXPIRY_DAYS: 30 // Service/part listing expiry window
    },
    SMART_ALERT: {
        EXPIRY_DAYS: 30 // Smart alert validity window
    },
    LOCATION: {
        SPOOFING_THRESHOLD_KM: 50, // Flag if pincode vs coords > 50km
        MAX_PRECISION_DECIMALS: 5
    }
};
