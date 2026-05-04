"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuditLogQuerySchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.adminAuditLogQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(120).optional(),
    action: zod_1.z.string().trim().max(100).optional(),
    targetType: zod_1.z.string().trim().max(100).optional(),
    adminId: common_1.commonSchemas.objectId.optional(),
    requestId: zod_1.z.string().trim().max(120).optional(),
    correlationId: zod_1.z.string().trim().max(120).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
}).strict();
//# sourceMappingURL=adminAudit.validator.js.map