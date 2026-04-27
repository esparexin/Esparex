"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblockUserById = exports.blockUserById = exports.checkUserExistsById = exports.getUserAvatarById = exports.findUserByEmail = exports.getUserPhoneVerification = exports.getUserWithBusiness = exports.getUserById = exports.removeUserFcmToken = exports.updateUser = void 0;
const User_1 = __importDefault(require("@core/models/User"));
const Business_1 = __importDefault(require("@core/models/Business"));
const BlockedUser_1 = __importDefault(require("@core/models/BlockedUser"));
const mongoose_1 = __importDefault(require("mongoose"));
const updateUser = async (id, updates) => {
    return await User_1.default.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    }).select('-password');
};
exports.updateUser = updateUser;
const removeUserFcmToken = async (userId, token) => {
    await User_1.default.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token } }
    });
};
exports.removeUserFcmToken = removeUserFcmToken;
const getUserById = async (userId) => {
    return User_1.default.findById(userId).lean();
};
exports.getUserById = getUserById;
const getUserWithBusiness = async (userId) => {
    const [user, business] = await Promise.all([
        User_1.default.findById(userId).select('-password -salt').lean(),
        Business_1.default.findOne({ userId }).lean(),
    ]);
    return { user, business };
};
exports.getUserWithBusiness = getUserWithBusiness;
const getUserPhoneVerification = async (userId) => {
    return User_1.default.findById(userId).select('isPhoneVerified mobile').lean();
};
exports.getUserPhoneVerification = getUserPhoneVerification;
const findUserByEmail = async (email) => {
    return User_1.default.findOne({ email });
};
exports.findUserByEmail = findUserByEmail;
const getUserAvatarById = async (userId) => {
    return User_1.default.findById(userId).select('avatar').lean();
};
exports.getUserAvatarById = getUserAvatarById;
const checkUserExistsById = async (userId) => {
    return User_1.default.exists({
        _id: new mongoose_1.default.Types.ObjectId(userId),
        isDeleted: { $ne: true }
    });
};
exports.checkUserExistsById = checkUserExistsById;
const blockUserById = async (blockerId, blockedUserId) => {
    return BlockedUser_1.default.updateOne({
        blockerId: new mongoose_1.default.Types.ObjectId(blockerId),
        blockedId: new mongoose_1.default.Types.ObjectId(blockedUserId)
    }, {
        $setOnInsert: {
            blockerId: new mongoose_1.default.Types.ObjectId(blockerId),
            blockedId: new mongoose_1.default.Types.ObjectId(blockedUserId)
        }
    }, { upsert: true });
};
exports.blockUserById = blockUserById;
const unblockUserById = async (blockerId, blockedUserId) => {
    return BlockedUser_1.default.deleteOne({
        blockerId: new mongoose_1.default.Types.ObjectId(blockerId),
        blockedId: new mongoose_1.default.Types.ObjectId(blockedUserId)
    });
};
exports.unblockUserById = unblockUserById;
//# sourceMappingURL=UserService.js.map