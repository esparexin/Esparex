"use strict";
/**
 * Centralized Text Field Schemas
 * Use these schemas instead of plain z.string() to get automatic validation
 *
 * IMPORTANT: All limits are sourced from /shared/constants/fieldLimits.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalTextSchema = exports.addressSchema = exports.searchQuerySchema = exports.businessNameSchema = exports.nameSchema = exports.shortTextSchema = exports.descriptionExtendedSchema = exports.descriptionSchema = exports.titleExtendedSchema = exports.titleSchema = exports.validatedTextSchema = void 0;
const zod_1 = require("zod");
const textValidator_1 = require("../utils/textValidator");
const fieldLimits_1 = require("../constants/fieldLimits");
/**
 * Creates a validated text schema with centralized content checks
 * Automatically validates against banned words, gibberish, and quality issues
 */
const validatedTextSchema = (options = {}) => {
    const { fieldName = 'Text', ...validationOptions } = options;
    return zod_1.z.string()
        .transform(val => val.trim())
        .superRefine((val, ctx) => {
        if (validationOptions.allowEmpty && !val)
            return;
        const result = (0, textValidator_1.validateText)(val, validationOptions);
        if (result.action === 'reject') {
            let error = (0, textValidator_1.getValidationError)(result);
            // Replace generic 'Text' with actual field name if possible
            if (error && error.includes('Text ')) {
                error = error.replace('Text ', `${fieldName} `);
            }
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: error || `${fieldName} contains prohibited content`
            });
        }
    });
};
exports.validatedTextSchema = validatedTextSchema;
/**
 * Title field schema - strict validation (uses TEXT_LIMITS.TITLE)
 * Used for: Ad titles
 */
exports.titleSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Title',
    minLength: fieldLimits_1.TEXT_LIMITS.TITLE.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.TITLE.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});
/**
 * Extended title schema (uses TEXT_LIMITS.TITLE_EXTENDED)
 * Used for: Service titles, Business names
 */
exports.titleExtendedSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Title',
    minLength: fieldLimits_1.TEXT_LIMITS.TITLE_EXTENDED.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.TITLE_EXTENDED.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});
/**
 * Description field schema (uses TEXT_LIMITS.DESCRIPTION)
 * Used for: Ad descriptions
 */
exports.descriptionSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Description',
    minLength: fieldLimits_1.TEXT_LIMITS.DESCRIPTION.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.DESCRIPTION.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});
/**
 * Extended description schema (uses TEXT_LIMITS.DESCRIPTION_EXTENDED)
 * Used for: Service descriptions, Business descriptions
 */
exports.descriptionExtendedSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Description',
    minLength: fieldLimits_1.TEXT_LIMITS.DESCRIPTION_EXTENDED.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.DESCRIPTION_EXTENDED.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: true
});
/**
 * Short text schema (uses TEXT_LIMITS.SHORT_TEXT)
 * Used for: Comments, messages, reviews
 */
exports.shortTextSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Text',
    minLength: fieldLimits_1.TEXT_LIMITS.SHORT_TEXT.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.SHORT_TEXT.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});
/**
 * Name field schema (uses TEXT_LIMITS.NAME)
 * Used for: User names, display names
 */
exports.nameSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Name',
    minLength: fieldLimits_1.TEXT_LIMITS.NAME.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.NAME.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});
/**
 * Business name schema (uses TEXT_LIMITS.BUSINESS_NAME)
 */
exports.businessNameSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Business Name',
    minLength: fieldLimits_1.TEXT_LIMITS.BUSINESS_NAME.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.BUSINESS_NAME.MAX,
    strictMode: true,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});
/**
 * Search query schema (uses TEXT_LIMITS.SEARCH_QUERY)
 */
exports.searchQuerySchema = (0, exports.validatedTextSchema)({
    fieldName: 'Search',
    allowEmpty: true,
    maxLength: fieldLimits_1.TEXT_LIMITS.SEARCH_QUERY.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: false,
    checkQuality: false
});
/**
 * Address field schema (uses TEXT_LIMITS.ADDRESS)
 */
exports.addressSchema = (0, exports.validatedTextSchema)({
    fieldName: 'Address',
    minLength: fieldLimits_1.TEXT_LIMITS.ADDRESS.MIN,
    maxLength: fieldLimits_1.TEXT_LIMITS.ADDRESS.MAX,
    strictMode: false,
    checkBannedWords: true,
    checkGibberish: true,
    checkQuality: false
});
/**
 * Optional validated text - allows empty/undefined
 */
const optionalTextSchema = (options = {}) => {
    return (0, exports.validatedTextSchema)({ ...options, allowEmpty: true }).optional();
};
exports.optionalTextSchema = optionalTextSchema;
//# sourceMappingURL=text.schema.js.map