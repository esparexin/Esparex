"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndVerifyOwnedListing = void 0;
const errorResponse_1 = require("./errorResponse");
const requestParams_1 = require("./requestParams");
const Ad_1 = __importDefault(require("@core/models/Ad"));
/**
 * Shared Controller Helpers
 * Used to reduce duplication in ownership and existence checks.
 */
const getAndVerifyOwnedListing = async (req, res, options = {}) => {
    const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid Listing ID' });
    if (!id)
        return null;
    const user = req.user;
    if (!user) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 401, 'Unauthorized');
        return null;
    }
    const query = {
        _id: id,
        sellerId: user._id,
        isDeleted: false,
    };
    if (options.listingType) {
        query.listingType = options.listingType;
    }
    const listing = await Ad_1.default.findOne(query).select(options.select || '');
    if (!listing) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 404, options.errorMessage || 'Listing not found or access denied');
        return null;
    }
    return listing;
};
exports.getAndVerifyOwnedListing = getAndVerifyOwnedListing;
//# sourceMappingURL=controllerUtils.js.map