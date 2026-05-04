"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPlanQuerySchema = exports.adminUpdateInvoiceStatusSchema = exports.adminCreateInvoiceSchema = exports.adminInvoiceQuerySchema = exports.adminTransactionQuerySchema = exports.createPaymentOrderSchema = exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const paymentStatus_1 = require("@core/constants/enums/paymentStatus");
const common_1 = require("./common");
const objectIdSchema = zod_1.z.string().refine(v => mongoose_1.default.isValidObjectId(v), 'Invalid ObjectId format');
const paymentStatusSchema = zod_1.z.enum([
    paymentStatus_1.PAYMENT_STATUS.PENDING,
    paymentStatus_1.PAYMENT_STATUS.SUCCESS,
    paymentStatus_1.PAYMENT_STATUS.FAILED,
    paymentStatus_1.PAYMENT_STATUS.CANCELLED,
]);
const adminInvoiceStatusFilterSchema = zod_1.z.enum([
    'all',
    paymentStatus_1.PAYMENT_STATUS.PENDING,
    paymentStatus_1.PAYMENT_STATUS.SUCCESS,
    paymentStatus_1.PAYMENT_STATUS.FAILED,
    paymentStatus_1.PAYMENT_STATUS.CANCELLED,
]);
const adminTransactionStatusFilterSchema = zod_1.z.enum([
    'all',
    paymentStatus_1.PAYMENT_STATUS.INITIATED,
    paymentStatus_1.PAYMENT_STATUS.SUCCESS,
    paymentStatus_1.PAYMENT_STATUS.FAILED,
]);
const adminPlanTypeFilterSchema = zod_1.z.enum(['all', 'AD_PACK', 'SPOTLIGHT', 'SMART_ALERT']);
const LEGACY_FINANCE_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin finance filters. Use `q` instead.';
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
const rejectLegacyFinanceSearchAlias = (raw) => {
    if (!hasOwn(raw, 'search'))
        return;
    throw new zod_1.z.ZodError([
        {
            code: zod_1.z.ZodIssueCode.custom,
            path: ['search'],
            message: LEGACY_FINANCE_SEARCH_ALIAS_MESSAGE,
        },
    ]);
};
const invoiceItemSchema = zod_1.z.object({
    description: zod_1.z.string().trim().min(1).max(500),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().min(0)
});
exports.createInvoiceSchema = zod_1.z.object({
    customerName: zod_1.z.string().trim().min(1).max(255),
    customerEmail: zod_1.z.string().email(),
    customerGst: zod_1.z.string().trim().max(50).optional(),
    items: zod_1.z.array(invoiceItemSchema).min(1),
    isGstInvoice: zod_1.z.boolean().optional(),
    currency: zod_1.z.string().trim().length(3).optional()
}).strict();
exports.createPaymentOrderSchema = zod_1.z.object({
    planId: objectIdSchema
}).strict();
const adminTransactionQuerySchemaBase = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    ...common_1.commonSchemas.search.shape,
    status: adminTransactionStatusFilterSchema.optional(),
    startDate: zod_1.z.string().trim().max(50).optional(),
    endDate: zod_1.z.string().trim().max(50).optional(),
}).strict();
exports.adminTransactionQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyFinanceSearchAlias(raw);
    return raw;
}, adminTransactionQuerySchemaBase);
const adminInvoiceQuerySchemaBase = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    ...common_1.commonSchemas.search.shape,
    status: adminInvoiceStatusFilterSchema.optional(),
}).strict();
exports.adminInvoiceQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyFinanceSearchAlias(raw);
    return raw;
}, adminInvoiceQuerySchemaBase);
exports.adminCreateInvoiceSchema = zod_1.z.object({
    customerEmail: zod_1.z.string().email(),
    planId: objectIdSchema.optional(),
    amount: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().trim().length(3).optional(),
    items: zod_1.z.array(invoiceItemSchema).min(1).optional(),
    isGstInvoice: zod_1.z.boolean().optional(),
    status: paymentStatusSchema.optional(),
}).strict().superRefine((value, ctx) => {
    if (!value.planId && (!value.items || value.items.length === 0)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['items'],
            message: 'Either planId or at least one item is required',
        });
    }
});
exports.adminUpdateInvoiceStatusSchema = zod_1.z.object({
    status: paymentStatusSchema,
    notes: zod_1.z.string().trim().max(500).optional(),
}).strict();
const adminPlanQuerySchemaBase = zod_1.z.object({
    ...common_1.commonSchemas.search.shape,
    type: adminPlanTypeFilterSchema.optional(),
}).strict();
exports.adminPlanQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyFinanceSearchAlias(raw);
    return raw;
}, adminPlanQuerySchemaBase);
//# sourceMappingURL=finance.validator.js.map