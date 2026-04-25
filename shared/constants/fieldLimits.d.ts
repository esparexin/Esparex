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
export declare const TEXT_LIMITS: {
    readonly TITLE: {
        readonly MIN: 10;
        readonly MAX: 60;
        readonly ERROR_MIN: "Title must be at least 10 characters";
        readonly ERROR_MAX: "Title must be 60 characters or fewer";
    };
    readonly TITLE_EXTENDED: {
        readonly MIN: 10;
        readonly MAX: 100;
        readonly ERROR_MIN: "Title must be at least 10 characters";
        readonly ERROR_MAX: "Title must be 100 characters or fewer";
    };
    readonly DESCRIPTION: {
        readonly MIN: 20;
        readonly MAX: 500;
        readonly ERROR_MIN: "Description must be at least 20 characters";
        readonly ERROR_MAX: "Description must be 500 characters or fewer";
    };
    readonly DESCRIPTION_EXTENDED: {
        readonly MIN: 20;
        readonly MAX: 2000;
        readonly ERROR_MIN: "Description must be at least 20 characters";
        readonly ERROR_MAX: "Description must be 2000 characters or fewer";
    };
    readonly SHORT_TEXT: {
        readonly MIN: 1;
        readonly MAX: 500;
        readonly ERROR_MIN: "Text is required";
        readonly ERROR_MAX: "Text must be 500 characters or fewer";
    };
    readonly NAME: {
        readonly MIN: 2;
        readonly MAX: 50;
        readonly ERROR_MIN: "Name must be at least 2 characters";
        readonly ERROR_MAX: "Name must be 50 characters or fewer";
    };
    readonly BUSINESS_NAME: {
        readonly MIN: 3;
        readonly MAX: 100;
        readonly ERROR_MIN: "Business name must be at least 3 characters";
        readonly ERROR_MAX: "Business name must be 100 characters or fewer";
    };
    readonly SEARCH_QUERY: {
        readonly MIN: 0;
        readonly MAX: 200;
        readonly ERROR_MAX: "Search query must be 200 characters or fewer";
    };
    readonly ADDRESS: {
        readonly MIN: 5;
        readonly MAX: 300;
        readonly ERROR_MIN: "Address must be at least 5 characters";
        readonly ERROR_MAX: "Address must be 300 characters or fewer";
    };
    readonly TAGLINE: {
        readonly MIN: 0;
        readonly MAX: 80;
        readonly ERROR_MAX: "Tagline must be 80 characters or fewer";
    };
};
export declare const CONTACT_LIMITS: {
    readonly PHONE: {
        readonly MIN_DIGITS: 10;
        readonly MAX_LENGTH: 20;
        readonly PATTERN: RegExp;
        readonly ERROR_MIN: "Mobile number must have at least 10 digits";
        readonly ERROR_FORMAT: "Please enter a valid mobile number";
    };
    readonly EMAIL: {
        readonly MAX: 255;
        readonly ERROR_FORMAT: "Please enter a valid email address";
        readonly ERROR_MAX: "Email must be 255 characters or fewer";
    };
    readonly WEBSITE: {
        readonly MAX: 2048;
        readonly ERROR_FORMAT: "Please enter a valid URL starting with http:// or https://";
        readonly ERROR_MAX: "URL must be 2048 characters or fewer";
    };
};
export declare const BUSINESS_LIMITS: {
    readonly GST: {
        readonly LENGTH: 15;
        readonly PATTERN: RegExp;
        readonly ERROR_FORMAT: "Please enter a valid 15-character GST number";
    };
    readonly PINCODE: {
        readonly LENGTH: 6;
        readonly PATTERN: RegExp;
        readonly ERROR_FORMAT: "Please enter a valid 6-digit pincode";
    };
    readonly REGISTRATION: {
        readonly MIN: 5;
        readonly MAX: 30;
        readonly ERROR_MIN: "Registration number is too short";
        readonly ERROR_MAX: "Registration number is too long";
    };
    readonly IMAGES: {
        readonly MIN: 1;
        readonly MAX: 20;
        readonly ERROR_MIN: "At least 1 shop image is required";
        readonly ERROR_MAX: "Maximum 20 shop images allowed";
    };
};
export declare const AD_LIMITS: {
    readonly IMAGES: {
        readonly MIN: 1;
        readonly MAX: 6;
        readonly MAX_BYTES: number;
        readonly ERROR_MIN: "At least 1 image is required";
        readonly ERROR_MAX: "Maximum 6 images allowed";
    };
    readonly SPARE_PARTS: {
        readonly MAX: 20;
        readonly ERROR_MAX: "Maximum 20 spare parts allowed";
    };
    readonly PRICE: {
        readonly MIN: 0;
        readonly MAX: 10000000;
        readonly ERROR_MIN: "Price must be at least 0";
        readonly ERROR_MAX: "Price cannot exceed ₹1 crore";
    };
};
export declare const SERVICE_LIMITS: {
    readonly IMAGES: {
        readonly MIN: 1;
        readonly MAX: 10;
        readonly ERROR_MIN: "At least 1 image is required";
        readonly ERROR_MAX: "Maximum 10 images allowed";
    };
    readonly SERVICE_TYPES: {
        readonly MIN: 1;
        readonly MAX: 20;
        readonly ERROR_MIN: "At least one service type is required";
        readonly ERROR_MAX: "Maximum 20 service types allowed";
    };
};
export declare const PAGINATION_LIMITS: {
    readonly PAGE: {
        readonly MIN: 1;
        readonly DEFAULT: 1;
    };
    readonly LIMIT: {
        readonly MIN: 1;
        readonly MAX: 100;
        readonly DEFAULT: 20;
    };
};
export declare const COORDINATE_LIMITS: {
    readonly LAT: {
        readonly MIN: -90;
        readonly MAX: 90;
    };
    readonly LNG: {
        readonly MIN: -180;
        readonly MAX: 180;
    };
    readonly RADIUS_KM: {
        readonly MIN: 0;
        readonly MAX: 500;
    };
};
export type TextLimitKey = keyof typeof TEXT_LIMITS;
export type ContactLimitKey = keyof typeof CONTACT_LIMITS;
export type BusinessLimitKey = keyof typeof BUSINESS_LIMITS;
