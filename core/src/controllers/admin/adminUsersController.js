"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.toggleAdminStatus = exports.deactivateAdmin = exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.updateUserStatus = exports.updateUser = exports.createUser = exports.verifyUser = exports.getUserById = exports.getAdminById = exports.getAdmins = exports.getUserManagementOverview = exports.getUsers = void 0;
const userStatusService = __importStar(require("@esparex/core/services/UserStatusService"));
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const userStatus_1 = require("@shared/enums/userStatus");
const adminUsersService = __importStar(require("@esparex/core/services/AdminUsersService"));
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const getActorId = (req) => req.user?._id?.toString() ?? req.user?.id ?? '';
const getActorRole = (req) => (req.user?.role) ?? '';
const getIp = (req) => ((req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();
const getUserAgent = (req) => req.headers['user-agent'] || '';
const buildLogFn = (req) => (action, targetType, targetId, metadata) => (0, adminLogger_1.logAdminActionDirect)(getActorId(req), action, targetType, targetId, metadata, getIp(req), getUserAgent(req));
// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------
const getUsers = async (req, res) => {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const search = req.query.q;
        const status = req.query.status;
        const role = req.query.role;
        const isVerified = typeof req.query.isVerified === 'boolean'
            ? req.query.isVerified
            : req.query.isVerified !== undefined
                ? req.query.isVerified === 'true'
                : undefined;
        const { data, total } = await adminUsersService.getUsers({ search, status, role, isVerified }, { skip, limit });
        (0, adminBaseController_1.sendPaginatedResponse)(res, data, total, page, limit);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getUsers = getUsers;
const getUserManagementOverview = async (req, res) => {
    try {
        const summary = await adminUsersService.getUserManagementOverview();
        (0, adminBaseController_1.sendSuccessResponse)(res, summary);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getUserManagementOverview = getUserManagementOverview;
const getAdmins = async (req, res) => {
    try {
        const admins = await adminUsersService.getAdmins();
        (0, adminBaseController_1.sendSuccessResponse)(res, admins);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAdmins = getAdmins;
const getAdminById = async (req, res) => {
    try {
        const admin = await adminUsersService.getAdminByIdForAdmin(req.params.id);
        if (!admin) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Admin not found', 404);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, admin);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAdminById = getAdminById;
const getUserById = async (req, res) => {
    try {
        const user = await adminUsersService.getUserByIdForAdmin(req.params.id);
        if (!user) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'User not found', 404);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, adminUsersService.normalizeAdminManagedUser(user));
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getUserById = getUserById;
const verifyUser = async (req, res) => {
    try {
        const { isVerified: verified } = req.body;
        const user = await adminUsersService.verifyUserById(req.params.id, verified, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, user, 'User verification updated');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.verifyUser = verifyUser;
// ADMIN MANAGEMENT
const createUser = async (req, res) => {
    try {
        const userObj = await adminUsersService.createAdminUser(req.body, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, userObj, 'User created successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id: userId } = req.params;
        if (!userId || typeof userId !== 'string') {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid user id', 400);
        }
        const user = await adminUsersService.updateAdminUser(userId, req.body, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, user, 'User updated successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateUser = updateUser;
const updateUserStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;
        const { id: userId } = req.params;
        if (![userStatus_1.USER_STATUS.LIVE, userStatus_1.USER_STATUS.SUSPENDED, userStatus_1.USER_STATUS.BANNED].includes(status)) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid status', 400);
        }
        if (!userId || typeof userId !== 'string') {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid user id', 400);
        }
        const user = await userStatusService.updateUserStatus(userId, status, {
            actor: 'ADMIN',
            logFn: buildLogFn(req),
            reason
        });
        (0, adminBaseController_1.sendSuccessResponse)(res, adminUsersService.normalizeAdminManagedUser(user), `User status updated to ${status}`);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateUserStatus = updateUserStatus;
const createAdmin = async (req, res) => {
    try {
        const adminObj = await adminUsersService.createAdminAccount(req.body, getActorRole(req), getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, adminObj, 'Admin created successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.createAdmin = createAdmin;
const updateAdmin = async (req, res) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid admin id', 400);
        }
        const updatedAdmin = await adminUsersService.updateAdminById(targetId, req.body, getActorId(req), getActorRole(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, updatedAdmin, 'Admin updated successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateAdmin = updateAdmin;
const deleteAdmin = async (req, res) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid admin id', 400);
        }
        await adminUsersService.softDeleteAdminById(targetId, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, null, 'Admin deleted successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.deleteAdmin = deleteAdmin;
const deactivateAdmin = async (req, res) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid admin id', 400);
        }
        const admin = await adminUsersService.deactivateAdminById(targetId, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, admin, 'Admin deactivated successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.deactivateAdmin = deactivateAdmin;
const toggleAdminStatus = async (req, res) => {
    try {
        const targetId = typeof req.params.id === 'string' ? req.params.id : '';
        if (!targetId) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid admin id', 400);
        }
        const adminObj = await adminUsersService.toggleAdminStatus(targetId, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, adminObj, `Admin status updated`);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.toggleAdminStatus = toggleAdminStatus;
const deleteUser = async (req, res) => {
    try {
        await userStatusService.updateUserStatus(req.params.id, userStatus_1.USER_STATUS.DELETED, {
            actor: 'ADMIN',
            logFn: buildLogFn(req),
            reason: 'Admin Soft Delete'
        });
        (0, adminBaseController_1.sendSuccessResponse)(res, null, 'User deleted successfully (Soft Delete)');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=adminUsersController.js.map