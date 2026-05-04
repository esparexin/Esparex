"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSellerAdPosted = void 0;
const logger_1 = __importDefault(require("@core/utils/logger"));
const logDeprecatedSignal = (signal, userIdInput) => {
    logger_1.default.debug('Deprecated seller reputation signal ignored', {
        signal,
        userId: String(userIdInput ?? '')
    });
};
const recordSellerAdPosted = (userIdInput) => {
    logDeprecatedSignal('recordSellerAdPosted', userIdInput);
};
exports.recordSellerAdPosted = recordSellerAdPosted;
//# sourceMappingURL=SellerTrustSignalsService.js.map