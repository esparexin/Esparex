"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPlanModel = exports.PlanModel = exports.checkPostLimit = exports.consumeAdPostingSlot = exports.resetWalletsForNewCycle = exports.upsertUserPlan = exports.findPlanByIdOrCode = exports.getActivePlans = exports.adminGetPlanById = exports.getPlanById = exports.adminGetPlans = exports.adminUpdatePlan = exports.adminCreatePlan = void 0;
const UserPlan_1 = __importDefault(require("@core/models/UserPlan"));
const Plan_1 = __importDefault(require("@core/models/Plan"));
const serviceStatus_1 = require("@core/constants/enums/serviceStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const inventoryStatus_1 = require("@core/constants/enums/inventoryStatus");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const AdSlotService_1 = require("./AdSlotService");
const AppError_1 = require("@core/utils/AppError");
const PlanEngine_1 = require("./PlanEngine");
const UserWallet_1 = __importDefault(require("@core/models/UserWallet"));
const AdSlotService_2 = require("./AdSlotService"); // Import the lock
// ─── Admin Plan CRUD ─────────────────────────────────────────────────────────
const adminCreatePlan = (payload) => Plan_1.default.create(payload);
exports.adminCreatePlan = adminCreatePlan;
const adminUpdatePlan = (planId, payload) => Plan_1.default.findByIdAndUpdate(planId, payload, { new: true });
exports.adminUpdatePlan = adminUpdatePlan;
const adminGetPlans = (query) => Plan_1.default.find(query).sort({ createdAt: -1 });
exports.adminGetPlans = adminGetPlans;
const getPlanById = (planId) => Plan_1.default.findById(planId);
exports.getPlanById = getPlanById;
exports.adminGetPlanById = exports.getPlanById;
const getActivePlans = async (query) => {
    return Plan_1.default.find(query).sort({ price: 1 });
};
exports.getActivePlans = getActivePlans;
const findPlanByIdOrCode = async (planId) => {
    const plan = await Plan_1.default.findById(planId).catch(() => null);
    if (plan)
        return plan;
    return Plan_1.default.findOne({ code: planId });
};
exports.findPlanByIdOrCode = findPlanByIdOrCode;
const upsertUserPlan = async (userId, planId, startDate, endDate) => {
    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    return UserPlan_1.default.findOneAndUpdate({ userId, planId }, { $set: { startDate, endDate, status: 'ACTIVE' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
};
exports.upsertUserPlan = upsertUserPlan;
// ─────────────────────────────────────────────────────────────────────────────
const resetWalletsForNewCycle = async (now = new Date()) => {
    const cycleStart = (0, AdSlotService_1.getMonthlyCycleStart)(now);
    const result = await UserWallet_1.default.updateMany({
        $or: [
            { lastMonthlyReset: { $exists: false } },
            { lastMonthlyReset: { $lt: cycleStart } }
        ]
    }, {
        $set: {
            lastMonthlyReset: now,
            monthlyFreeAdsUsed: 0
        }
    });
    return { cycleStart, modifiedCount: result.modifiedCount };
};
exports.resetWalletsForNewCycle = resetWalletsForNewCycle;
const consumeAdPostingSlot = async (userId, session, adId) => {
    return AdSlotService_1.AdSlotService.consumeSlot(userId, session, adId);
};
exports.consumeAdPostingSlot = consumeAdPostingSlot;
/**
 * Check if a user can post a new item based on their plan + wallet.
 * @param userId - The ID of the user trying to post.
 * @param type - The type of content ('ad', 'service', 'spare_part_listing').
 * @throws Error if limit reached.
 */
const checkPostLimit = async (userId, type, session) => {
    return (0, AdSlotService_2.withUserPostingLock)(userId, 15, async () => {
        // 1. Get All Active Plans (Stacking)
        let activeUserPlansQuery = UserPlan_1.default.find({
            userId,
            status: 'active',
            $or: [{ endDate: { $gte: new Date() } }, { endDate: null }]
        }).populate('planId');
        if (session)
            activeUserPlansQuery = activeUserPlansQuery.session(session);
        const activeUserPlans = await activeUserPlansQuery.lean();
        // 2. Calculate Permissions from Plans
        const plans = activeUserPlans.map((up) => up.planId).filter(Boolean);
        const permissions = (0, PlanEngine_1.calculateUserPlan)(plans);
        // 4. Determine Limits
        let limit = 0;
        if (type === 'ad') {
            const balance = await (0, AdSlotService_1.getAdPostingBalance)(userId, session);
            if (balance.totalRemaining <= 0) {
                throw new AppError_1.AppError('No ad posting slots available this month. Buy Ad Pack credits or wait for monthly reset.', 422, 'QUOTA_EXCEEDED');
            }
            return true;
        }
        else if (type === 'service') {
            limit = (permissions.maxServices || 100);
        }
        else if (type === 'spare_part_listing') {
            limit = (permissions.maxParts || 100);
        }
        // 5. Count Current Usage (Active Inventory)
        let currentCount = 0;
        if (type === 'service') {
            let serviceQuery = Ad_1.default.countDocuments({
                sellerId: userId,
                listingType: listingType_1.LISTING_TYPE.SERVICE,
                status: { $in: [serviceStatus_1.SERVICE_STATUS.LIVE, serviceStatus_1.SERVICE_STATUS.PENDING] },
                isDeleted: { $ne: true }
            });
            if (session)
                serviceQuery = serviceQuery.session(session);
            currentCount = await serviceQuery;
        }
        else if (type === 'spare_part_listing') {
            let splQuery = Ad_1.default.countDocuments({
                sellerId: userId,
                listingType: listingType_1.LISTING_TYPE.SPARE_PART,
                status: { $in: [inventoryStatus_1.INVENTORY_STATUS.LIVE, inventoryStatus_1.INVENTORY_STATUS.PENDING] },
                isDeleted: { $ne: true }
            });
            if (session)
                splQuery = splQuery.session(session);
            currentCount = await splQuery;
        }
        // 6. Enforce
        if (currentCount >= limit) {
            throw new AppError_1.AppError(`Active slot limit reached (${currentCount}/${limit}). Upgrade your plan or buy "Ad Packs" to increase capacity.`, 422, 'QUOTA_EXCEEDED');
        }
        return true;
    });
};
exports.checkPostLimit = checkPostLimit;
// ── Typed model wrappers for controller shared files ─────────────────────────
exports.PlanModel = Plan_1.default;
exports.UserPlanModel = UserPlan_1.default;
//# sourceMappingURL=PlanService.js.map