"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemConfigSections = exports.getSystemConfigForRead = exports.SystemConfigValidationError = void 0;
const zod_1 = require("zod");
const SystemConfig_1 = __importDefault(require("@core/models/SystemConfig"));
const objectUtils_1 = require("@core/utils/objectUtils");
const systemConfigHelper_1 = require("@core/utils/systemConfigHelper");
const systemConfig_validator_1 = require("../validators/systemConfig.validator");
const isObjectLike = (value) => (typeof value === 'object' && value !== null && !Array.isArray(value));
const hasToObject = (value) => (isObjectLike(value) && typeof value.toObject === 'function');
const SECTION_OBJECTS = [
    'ai',
    'security',
    'notifications',
    'platform',
    'integrations',
    'location',
    'listing',
];
const SECTION_ARRAYS = [
    'emailTemplates',
    'notificationTemplates',
];
class SystemConfigValidationError extends Error {
    statusCode;
    code;
    constructor(message, code = 'INVALID_SYSTEM_CONFIG_PATCH', statusCode = 400) {
        super(message);
        this.name = 'SystemConfigValidationError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.SystemConfigValidationError = SystemConfigValidationError;
const getWritableSystemConfig = async () => {
    const existing = await SystemConfig_1.default.findOne({ singletonKey: systemConfigHelper_1.SYSTEM_CONFIG_KEY });
    if (existing)
        return existing;
    const created = await (0, systemConfigHelper_1.ensureSystemConfig)();
    return created;
};
const getSystemConfigForRead = async (defaults = {}) => {
    return (0, systemConfigHelper_1.ensureSystemConfig)(defaults);
};
exports.getSystemConfigForRead = getSystemConfigForRead;
const validatePatchPayload = (payload) => {
    if (!isObjectLike(payload)) {
        throw new SystemConfigValidationError('Request body must be an object.', 'SYSTEM_CONFIG_BODY_INVALID');
    }
    try {
        return systemConfig_validator_1.systemConfigUpdateSchema.parse(payload);
    }
    catch (error) {
        if (!(error instanceof zod_1.ZodError)) {
            throw error;
        }
        const [issue] = error.issues;
        if (issue?.code === 'unrecognized_keys') {
            throw new SystemConfigValidationError(issue.message, 'SYSTEM_CONFIG_SECTION_UNSUPPORTED');
        }
        throw new SystemConfigValidationError(issue?.message || 'Invalid system configuration payload.', 'SYSTEM_CONFIG_SECTION_TYPE_INVALID');
    }
};
const normalizeExistingSection = (value) => {
    if (value instanceof Map) {
        return Object.fromEntries(value.entries());
    }
    if (hasToObject(value))
        return value.toObject();
    return isObjectLike(value) ? value : {};
};
const updateSystemConfigSections = async (payload, adminId) => {
    const updates = validatePatchPayload(payload);
    const updatedSections = Object.keys(updates);
    if (updatedSections.length === 0) {
        throw new SystemConfigValidationError('No supported config sections were provided.', 'SYSTEM_CONFIG_EMPTY_PATCH');
    }
    const config = await getWritableSystemConfig();
    for (const section of SECTION_OBJECTS) {
        const incoming = updates[section];
        if (incoming === undefined)
            continue;
        const existing = normalizeExistingSection(config.get(section));
        const merged = (0, objectUtils_1.deepMerge)(existing, incoming);
        config.set(section, merged);
    }
    for (const section of SECTION_ARRAYS) {
        const incoming = updates[section];
        if (incoming === undefined)
            continue;
        config.set(section, incoming);
    }
    if (adminId)
        config.updatedBy = adminId;
    config.updatedAt = new Date();
    await config.save();
    await (0, systemConfigHelper_1.invalidateSystemConfigCache)();
    return { config, updatedSections };
};
exports.updateSystemConfigSections = updateSystemConfigSections;
//# sourceMappingURL=SystemConfigService.js.map