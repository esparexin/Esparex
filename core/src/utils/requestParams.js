"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSingleParam = void 0;
const errorResponse_1 = require("./errorResponse");
const getSingleParam = (req, res, param, options = {}) => {
    const raw = req.params[param];
    if (!raw || Array.isArray(raw)) {
        const message = options.error ?? `Invalid ${options.label ?? param}`;
        (0, errorResponse_1.sendErrorResponse)(req, res, 400, message);
        return null;
    }
    return raw;
};
exports.getSingleParam = getSingleParam;
//# sourceMappingURL=requestParams.js.map