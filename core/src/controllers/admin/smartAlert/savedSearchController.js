"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSavedSearchEntry = exports.createSavedSearchEntry = exports.listSavedSearches = void 0;
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const respond_1 = require("@esparex/core/utils/respond");
const errorResponse_1 = require("@esparex/core/utils/errorResponse");
const SavedSearchService_1 = require("@esparex/core/services/SavedSearchService");
const getUserId = (req) => {
    const user = req.user;
    if (!user)
        return null;
    return (user.id || user._id)?.toString() || null;
};
const listSavedSearches = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
            return;
        }
        const data = await (0, SavedSearchService_1.getSavedSearches)(userId);
        res.json((0, respond_1.respond)({
            success: true,
            data
        }));
    }
    catch (error) {
        logger_1.default.error('Failed to fetch saved searches', error);
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, 'Failed to fetch saved searches');
    }
};
exports.listSavedSearches = listSavedSearches;
const createSavedSearchEntry = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
            return;
        }
        const payload = req.body;
        const created = await (0, SavedSearchService_1.createSavedSearch)(userId, payload);
        res.status(201).json((0, respond_1.respond)({
            success: true,
            data: created
        }));
    }
    catch (error) {
        logger_1.default.error('Failed to create saved search', error);
        (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Failed to create saved search');
    }
};
exports.createSavedSearchEntry = createSavedSearchEntry;
const deleteSavedSearchEntry = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
            return;
        }
        const id = typeof req.params.id === 'string' ? req.params.id : '';
        const removed = await (0, SavedSearchService_1.deleteSavedSearch)(userId, id);
        if (!removed) {
            (0, errorResponse_1.sendErrorResponse)(req, res, 404, 'Saved search not found');
            return;
        }
        res.json((0, respond_1.respond)({
            success: true,
            message: 'Saved search deleted',
            data: { id }
        }));
    }
    catch (error) {
        logger_1.default.error('Failed to delete saved search', error);
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, 'Failed to delete saved search');
    }
};
exports.deleteSavedSearchEntry = deleteSavedSearchEntry;
//# sourceMappingURL=savedSearchController.js.map