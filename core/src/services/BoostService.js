"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveBoostsForUser = getActiveBoostsForUser;
const Boost_1 = __importDefault(require("@core/models/Boost"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
async function getActiveBoostsForUser(userId) {
    const userListings = await Ad_1.default.find({ sellerId: userId }).select('_id');
    const entityIds = userListings.map(l => l._id);
    return Boost_1.default.find({
        entityId: { $in: entityIds },
        isActive: true,
    }).sort({ endsAt: 1 }).lean();
}
//# sourceMappingURL=BoostService.js.map