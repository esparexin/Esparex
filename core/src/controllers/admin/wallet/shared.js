"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = exports.TransactionModel = exports.WalletModel = void 0;
var WalletService_1 = require("@esparex/core/services/WalletService");
Object.defineProperty(exports, "WalletModel", { enumerable: true, get: function () { return WalletService_1.WalletModel; } });
Object.defineProperty(exports, "TransactionModel", { enumerable: true, get: function () { return WalletService_1.TransactionModel; } });
const getErrorMessage = (error) => error instanceof Error ? error.message : 'Unexpected error';
exports.getErrorMessage = getErrorMessage;
//# sourceMappingURL=shared.js.map