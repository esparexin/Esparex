"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceByOwner = exports.findServiceForUpdate = void 0;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const findServiceForUpdate = async (id, userId, businessId, listingType) => Ad_1.default.findOne({
    _id: id,
    listingType,
    businessId: businessId || { $exists: false },
    sellerId: userId,
})
    .select('images status approvedAt categoryId brandId')
    .lean();
exports.findServiceForUpdate = findServiceForUpdate;
const updateServiceByOwner = async (id, userId, businessId, listingType, updates) => Ad_1.default.findOneAndUpdate({ _id: id, listingType, businessId: businessId || { $exists: false }, sellerId: userId }, updates, { new: true });
exports.updateServiceByOwner = updateServiceByOwner;
//# sourceMappingURL=ServiceMutationRepository.js.map