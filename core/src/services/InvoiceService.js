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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureInvoicePdf = exports.buildInvoicePayload = exports.getInvoiceByIdOrTransaction = exports.getInvoiceById = exports.createInvoiceRecord = exports.saveInvoice = exports.findInvoiceForUpdate = exports.PAYMENT_SAC_CODE = void 0;
exports.getInvoices = getInvoices;
const Invoice_1 = __importDefault(require("@core/models/Invoice"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("@core/models/User"));
const Business_1 = __importDefault(require("@core/models/Business"));
const stringUtils_1 = require("@core/utils/stringUtils");
const invoiceNumber_1 = require("@core/utils/invoiceNumber");
const InvoicePdfService_1 = require("./InvoicePdfService");
const logger_1 = __importStar(require("@core/utils/logger"));
exports.PAYMENT_SAC_CODE = '998599';
const buildInvoiceQuery = async (filters = {}) => {
    const query = {};
    if (filters.userId && mongoose_1.default.Types.ObjectId.isValid(filters.userId)) {
        query.userId = new mongoose_1.default.Types.ObjectId(filters.userId);
    }
    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }
    if (filters.search) {
        const safeSearch = (0, stringUtils_1.escapeRegExp)(filters.search);
        const searchOr = [
            { invoiceNumber: { $regex: safeSearch, $options: 'i' } },
        ];
        if (mongoose_1.default.Types.ObjectId.isValid(filters.search)) {
            searchOr.push({ _id: new mongoose_1.default.Types.ObjectId(filters.search) });
            searchOr.push({ transactionId: new mongoose_1.default.Types.ObjectId(filters.search) });
        }
        const users = await User_1.default.find({
            $or: [
                { firstName: { $regex: safeSearch, $options: 'i' } },
                { lastName: { $regex: safeSearch, $options: 'i' } },
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { mobile: { $regex: safeSearch, $options: 'i' } },
            ]
        }).select('_id');
        if (users.length > 0) {
            searchOr.push({ userId: { $in: users.map((user) => user._id) } });
        }
        query.$or = searchOr;
    }
    return query;
};
async function getInvoices(filters = {}, pagination) {
    const query = await buildInvoiceQuery(filters);
    const invoiceQuery = Invoice_1.default.find(query)
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 })
        .lean();
    if (!pagination) {
        return invoiceQuery.limit(100);
    }
    const [items, total] = await Promise.all([
        invoiceQuery.skip(pagination.skip).limit(pagination.limit),
        Invoice_1.default.countDocuments(query),
    ]);
    return {
        items,
        total,
    };
}
const findInvoiceForUpdate = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        return null;
    return Invoice_1.default.findById(id);
};
exports.findInvoiceForUpdate = findInvoiceForUpdate;
const saveInvoice = async (invoice) => {
    return invoice.save();
};
exports.saveInvoice = saveInvoice;
const createInvoiceRecord = async (data) => {
    return Invoice_1.default.create(data);
};
exports.createInvoiceRecord = createInvoiceRecord;
const getInvoiceById = async (id, userId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id))
        return null;
    const query = { _id: id };
    if (userId && mongoose_1.default.Types.ObjectId.isValid(userId)) {
        query.userId = new mongoose_1.default.Types.ObjectId(userId);
    }
    return Invoice_1.default.findOne(query)
        .populate('userId', 'name email mobile address')
        .lean();
};
exports.getInvoiceById = getInvoiceById;
const getInvoiceByIdOrTransaction = async (id) => {
    return Invoice_1.default.findOne({
        $or: [{ _id: id }, { transactionId: id }]
    }).lean();
};
exports.getInvoiceByIdOrTransaction = getInvoiceByIdOrTransaction;
const buildInvoicePayload = async (tx, session) => {
    const user = await User_1.default.findById(tx.userId)
        .select('name email mobile location businessId')
        .session(session)
        .lean();
    let business = null;
    if (user?.businessId) {
        business = await Business_1.default.findById(user.businessId).session(session).lean();
    }
    const subtotal = Number((tx.amount / 1.18).toFixed(2));
    const gstAmount = Number((tx.amount - subtotal).toFixed(2));
    const halfTax = Number((gstAmount / 2).toFixed(2));
    const issuedAt = new Date();
    const gstin = typeof business?.gstNumber === 'string' ? business.gstNumber : undefined;
    return {
        user,
        business,
        invoiceData: {
            invoiceNumber: await (0, invoiceNumber_1.generateInvoiceNumber)(session),
            userId: tx.userId,
            transactionId: tx._id,
            planSnapshot: tx.planSnapshot,
            items: [{
                    description: tx.planSnapshot?.name || tx.description || 'Esparex purchase',
                    quantity: 1,
                    unitPrice: subtotal,
                    total: subtotal
                }],
            isGstInvoice: true,
            gstin,
            sacCode: exports.PAYMENT_SAC_CODE,
            billingAddress: {
                line1: typeof business?.name === 'string' ? business.name : (typeof user?.name === 'string' ? user.name : undefined),
                line2: typeof business?.location?.address === 'string' ? business.location.address : undefined,
                city: typeof business?.location?.city === 'string'
                    ? business.location.city
                    : typeof user?.location?.city === 'string'
                        ? user.location.city
                        : undefined,
                country: 'India'
            },
            subtotal,
            cgst: halfTax,
            sgst: halfTax,
            igst: 0,
            total: tx.amount,
            amount: tx.amount,
            currency: tx.currency,
            status: 'SUCCESS',
            tax: {
                gst: gstAmount,
                total: tx.amount
            },
            issuedAt
        }
    };
};
exports.buildInvoicePayload = buildInvoicePayload;
const ensureInvoicePdf = async (invoiceId) => {
    if (!invoiceId)
        return;
    const invoice = await Invoice_1.default.findById(invoiceId).lean();
    if (!invoice || invoice.pdfUrl)
        return;
    const user = await User_1.default.findById(invoice.userId).select('name email mobile location businessId').lean();
    let business = null;
    if (user?.businessId) {
        business = await Business_1.default.findById(user.businessId).lean();
    }
    try {
        const pdfUser = business
            ? {
                name: typeof business.name === 'string' ? business.name : undefined,
                email: typeof business.email === 'string' ? business.email : undefined,
                mobile: typeof business.mobile === 'string' ? business.mobile : undefined,
            }
            : user
                ? {
                    name: typeof user.name === 'string' ? user.name : undefined,
                    email: typeof user.email === 'string' ? user.email : undefined,
                    mobile: typeof user.mobile === 'string' ? user.mobile : undefined,
                }
                : null;
        const pdfUrl = await (0, InvoicePdfService_1.generateInvoicePdf)({
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            currency: invoice.currency,
            issuedAt: invoice.issuedAt,
            subtotal: invoice.subtotal,
            cgst: invoice.cgst,
            sgst: invoice.sgst,
            igst: invoice.igst,
            total: invoice.total,
            gstin: invoice.gstin,
            sacCode: invoice.sacCode,
            user: pdfUser
        });
        if (!pdfUrl)
            return;
        await Invoice_1.default.updateOne({ _id: invoice._id, pdfUrl: { $exists: false } }, { $set: { pdfUrl } });
        (0, logger_1.logBusiness)('invoice_generated', {
            invoiceId: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            pdfUrl
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate invoice PDF after payment commit', {
            invoiceId: invoice._id.toString(),
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.ensureInvoicePdf = ensureInvoicePdf;
//# sourceMappingURL=InvoiceService.js.map