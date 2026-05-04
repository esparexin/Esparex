"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveServiceTypes = exports.toServiceTypeObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ServiceType_1 = __importDefault(require("@core/models/ServiceType"));
const stringUtils_1 = require("./stringUtils");
const toServiceTypeObjectId = (value) => {
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value;
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    if (!mongoose_1.default.Types.ObjectId.isValid(trimmed))
        return undefined;
    return new mongoose_1.default.Types.ObjectId(trimmed);
};
exports.toServiceTypeObjectId = toServiceTypeObjectId;
const normalizeServiceTypeTokens = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry) => entry.length > 0);
};
const resolveServiceTypes = async (rawServiceTypes, categoryId) => {
    const categoryObjectId = (0, exports.toServiceTypeObjectId)(categoryId);
    const tokens = normalizeServiceTypeTokens(rawServiceTypes);
    if (tokens.length === 0)
        return { serviceTypeIds: [] };
    const explicitIds = Array.from(new Set(tokens
        .map((token) => (0, exports.toServiceTypeObjectId)(token))
        .filter((value) => Boolean(value))
        .map((id) => id.toString())));
    const nameTokens = Array.from(new Set(tokens.filter((token) => !mongoose_1.default.Types.ObjectId.isValid(token))));
    const [byId, byName] = await Promise.all([
        explicitIds.length > 0
            ? ServiceType_1.default.find({
                _id: { $in: explicitIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) },
                ...(categoryObjectId ? { categoryId: categoryObjectId } : {}),
                isDeleted: { $ne: true }
            }).select('_id').lean()
            : Promise.resolve([]),
        nameTokens.length > 0
            ? ServiceType_1.default.find({
                ...(categoryObjectId ? { categoryId: categoryObjectId } : {}),
                isDeleted: { $ne: true },
                $or: nameTokens.map((name) => ({ name: new RegExp(`^${(0, stringUtils_1.escapeRegExp)(name)}$`, 'i') }))
            }).select('_id').lean()
            : Promise.resolve([])
    ]);
    const combined = [...byId, ...byName];
    const seen = new Set();
    const serviceTypeIds = [];
    combined.forEach((serviceType) => {
        const serviceTypeId = serviceType._id;
        const id = typeof serviceTypeId === 'string'
            ? serviceTypeId
            : serviceTypeId && typeof serviceTypeId.toString === 'function'
                ? serviceTypeId.toString()
                : '';
        if (!id || seen.has(id))
            return;
        seen.add(id);
        serviceTypeIds.push(new mongoose_1.default.Types.ObjectId(id));
    });
    return { serviceTypeIds };
};
exports.resolveServiceTypes = resolveServiceTypes;
//# sourceMappingURL=serviceTypeResolver.js.map