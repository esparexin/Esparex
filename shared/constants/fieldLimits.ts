/**
 * ENTERPRISE VALIDATION ENGINE - Field Limits Configuration
 * 
 * Single Source of Truth for ALL field validation rules across Esparex.
 * 
 * USAGE:
 * - Import these constants in Zod schemas
 * - Frontend and backend MUST use these values
 * - DO NOT duplicate these values anywhere else
 * 
 * @module shared/constants/fieldLimits
 */

// ============================================================================
// TEXT FIELD LIMITS
// ============================================================================

export const TEXT_LIMITS = {
    // Titles (ads, services, businesses)
    TITLE: {
        MIN: 10,
        MAX: 60,
        ERROR_MIN: 'Title must be at least 10 characters',
        ERROR_MAX: 'Title must be 60 characters or fewer',
    },

    // Extended titles (services, businesses with longer names)
    TITLE_EXTENDED: {
        MIN: 10,
        MAX: 100,
        ERROR_MIN: 'Title must be at least 10 characters',
        ERROR_MAX: 'Title must be 100 characters or fewer',
    },

    // Descriptions
    DESCRIPTION: {
        MIN: 20,
        MAX: 500,
        ERROR_MIN: 'Description must be at least 20 characters',
        ERROR_MAX: 'Description must be 500 characters or fewer',
    },

    // Extended descriptions (services, businesses)
    DESCRIPTION_EXTENDED: {
        MIN: 20,
        MAX: 2000,
        ERROR_MIN: 'Description must be at least 20 characters',
        ERROR_MAX: 'Description must be 2000 characters or fewer',
    },

    // Short text (comments, messages)
    SHORT_TEXT: {
        MIN: 1,
        MAX: 500,
        ERROR_MIN: 'Text is required',
        ERROR_MAX: 'Text must be 500 characters or fewer',
    },

    // Names (user names, business names)
    NAME: {
        MIN: 2,
        MAX: 50,
        ERROR_MIN: 'Name must be at least 2 characters',
        ERROR_MAX: 'Name must be 50 characters or fewer',
    },

    // Business names
    BUSINESS_NAME: {
        MIN: 3,
        MAX: 100,
        ERROR_MIN: 'Business name must be at least 3 characters',
        ERROR_MAX: 'Business name must be 100 characters or fewer',
    },

    // Search queries
    SEARCH_QUERY: {
        MIN: 0,
        MAX: 200,
        ERROR_MAX: 'Search query must be 200 characters or fewer',
    },

    // Addresses
    ADDRESS: {
        MIN: 5,
        MAX: 300,
        ERROR_MIN: 'Address must be at least 5 characters',
        ERROR_MAX: 'Address must be 300 characters or fewer',
    },

    // Taglines
    TAGLINE: {
        MIN: 0,
        MAX: 80,
        ERROR_MAX: 'Tagline must be 80 characters or fewer',
    },
} as const;

// ============================================================================
// CONTACT FIELD LIMITS
// ============================================================================

export const CONTACT_LIMITS = {
    // Phone/Mobile
    PHONE: {
        MIN_DIGITS: 10,
        MAX_LENGTH: 20,
        PATTERN: /^[6-9]\d{9}$/, // Indian mobile format
        ERROR_MIN: 'Phone number must have at least 10 digits',
        ERROR_FORMAT: 'Please enter a valid phone number',
    },

    // Email
    EMAIL: {
        MAX: 255,
        ERROR_FORMAT: 'Please enter a valid email address',
        ERROR_MAX: 'Email must be 255 characters or fewer',
    },

    // Website URL
    WEBSITE: {
        MAX: 2048,
        ERROR_FORMAT: 'Please enter a valid URL starting with http:// or https://',
        ERROR_MAX: 'URL must be 2048 characters or fewer',
    },
} as const;

// ============================================================================
// BUSINESS FIELD LIMITS
// ============================================================================

export const BUSINESS_LIMITS = {
    // GST Number
    GST: {
        LENGTH: 15,
        PATTERN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        ERROR_FORMAT: 'Please enter a valid 15-character GST number',
    },

    // Pincode
    PINCODE: {
        LENGTH: 6,
        PATTERN: /^\d{6}$/,
        ERROR_FORMAT: 'Please enter a valid 6-digit pincode',
    },

    // Registration Number
    REGISTRATION: {
        MIN: 5,
        MAX: 30,
        ERROR_MIN: 'Registration number is too short',
        ERROR_MAX: 'Registration number is too long',
    },

    // Shop/Business Images
    IMAGES: {
        MIN: 1,
        MAX: 20,
        ERROR_MIN: 'At least 1 shop image is required',
        ERROR_MAX: 'Maximum 20 shop images allowed',
    },
} as const;

// ============================================================================
// AD-SPECIFIC LIMITS (imported from adLimits.ts for consistency)
// ============================================================================

export const AD_LIMITS = {
    IMAGES: {
        MIN: 1,
        MAX: 6,
        MAX_BYTES: 5 * 1024 * 1024, // 5MB
        ERROR_MIN: 'At least 1 image is required',
        ERROR_MAX: 'Maximum 6 images allowed',
    },

    SPARE_PARTS: {
        MAX: 20,
        ERROR_MAX: 'Maximum 20 spare parts allowed',
    },

    PRICE: {
        MIN: 0,
        MAX: 10000000, // 1 crore
        ERROR_MIN: 'Price must be at least 0',
        ERROR_MAX: 'Price cannot exceed ₹1 crore',
    },
} as const;

// ============================================================================
// SERVICE LIMITS
// ============================================================================

export const SERVICE_LIMITS = {
    IMAGES: {
        MIN: 1,
        MAX: 10,
        ERROR_MIN: 'At least 1 image is required',
        ERROR_MAX: 'Maximum 10 images allowed',
    },

    SERVICE_TYPES: {
        MIN: 1,
        MAX: 20,
        ERROR_MIN: 'At least one service type is required',
        ERROR_MAX: 'Maximum 20 service types allowed',
    },
} as const;

// ============================================================================
// PAGINATION LIMITS
// ============================================================================

export const PAGINATION_LIMITS = {
    PAGE: {
        MIN: 1,
        DEFAULT: 1,
    },
    LIMIT: {
        MIN: 1,
        MAX: 100,
        DEFAULT: 20,
    },
} as const;

// ============================================================================
// COORDINATE LIMITS
// ============================================================================

export const COORDINATE_LIMITS = {
    LAT: { MIN: -90, MAX: 90 },
    LNG: { MIN: -180, MAX: 180 },
    RADIUS_KM: { MIN: 0, MAX: 500 },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TextLimitKey = keyof typeof TEXT_LIMITS;
export type ContactLimitKey = keyof typeof CONTACT_LIMITS;
export type BusinessLimitKey = keyof typeof BUSINESS_LIMITS;
