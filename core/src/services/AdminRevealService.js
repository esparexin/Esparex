"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhoneRequestsPaginated = exports.getPhoneRevealLogsPaginated = void 0;
const PhoneRevealLog_1 = __importDefault(require("@core/models/PhoneRevealLog"));
const PhoneRequest_1 = __importDefault(require("@core/models/PhoneRequest"));
const contentHandler_1 = require("../utils/contentHandler");
const getPhoneRevealLogsPaginated = (req, res, filters) => {
    return (0, contentHandler_1.handlePaginatedContent)(req, res, PhoneRevealLog_1.default, {
        publicQuery: filters,
        adminQuery: filters,
        populate: [
            { path: 'buyerId', select: 'name email avatar' },
            { path: 'sellerId', select: 'name email avatar' },
        ],
        defaultSort: { revealedAt: -1 },
    });
};
exports.getPhoneRevealLogsPaginated = getPhoneRevealLogsPaginated;
const getPhoneRequestsPaginated = (req, res, filters) => {
    return (0, contentHandler_1.handlePaginatedContent)(req, res, PhoneRequest_1.default, {
        publicQuery: filters,
        adminQuery: filters,
        populate: [
            { path: 'buyerId', select: 'name email' },
            { path: 'sellerId', select: 'name email' },
        ],
        defaultSort: { createdAt: -1 },
    });
};
exports.getPhoneRequestsPaginated = getPhoneRequestsPaginated;
//# sourceMappingURL=AdminRevealService.js.map