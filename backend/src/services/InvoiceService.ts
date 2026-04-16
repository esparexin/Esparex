import Invoice, { type IInvoice } from '../models/Invoice';
import mongoose, { type ClientSession } from 'mongoose';
import User from '../models/User';
import Business from '../models/Business';
import { escapeRegExp } from '../utils/stringUtils';
import { generateInvoiceNumber } from '../utils/invoiceNumber';
import { generateInvoicePdf } from './InvoicePdfService';
import { type ITransaction } from '../models/Transaction';
import logger, { logBusiness } from '../utils/logger';

export const PAYMENT_SAC_CODE = '998599';

export type PaymentUserLike = {
    name?: string;
    email?: string;
    mobile?: string;
    businessId?: mongoose.Types.ObjectId | string | null;
    location?: {
        city?: string;
    };
};

export type PaymentBusinessLike = {
    name?: string;
    email?: string;
    mobile?: string;
    gstNumber?: string;
    location?: {
        address?: string;
        city?: string;
    };
};


export interface InvoiceFilters {
    search?: string;
    status?: string;
    userId?: string;
}

type InvoicePagination = {
    skip: number;
    limit: number;
};

type InvoiceListItem = unknown;
type InvoiceListResult = InvoiceListItem[];

const buildInvoiceQuery = async (filters: InvoiceFilters = {}) => {
    const query: Record<string, unknown> & { $or?: Array<Record<string, unknown>> } = {};

    if (filters.userId && mongoose.Types.ObjectId.isValid(filters.userId)) {
        query.userId = new mongoose.Types.ObjectId(filters.userId);
    }

    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    if (filters.search) {
        const safeSearch = escapeRegExp(filters.search);
        const searchOr: Array<Record<string, unknown>> = [
            { invoiceNumber: { $regex: safeSearch, $options: 'i' } },
        ];

        if (mongoose.Types.ObjectId.isValid(filters.search)) {
            searchOr.push({ _id: new mongoose.Types.ObjectId(filters.search) });
            searchOr.push({ transactionId: new mongoose.Types.ObjectId(filters.search) });
        }

        const users = await User.find({
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

/**
 * Service for querying and managing invoices.
 */
export async function getInvoices(filters?: InvoiceFilters): Promise<InvoiceListResult>;
export async function getInvoices(
    filters: InvoiceFilters,
    pagination: InvoicePagination
): Promise<{ items: InvoiceListItem[]; total: number }>;
export async function getInvoices(
    filters: InvoiceFilters = {},
    pagination?: InvoicePagination
): Promise<InvoiceListResult | { items: InvoiceListItem[]; total: number }> {
    const query = await buildInvoiceQuery(filters);

    const invoiceQuery = Invoice.find(query)
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 })
        .lean();

    if (!pagination) {
        return invoiceQuery.limit(100);
    }

    const [items, total] = await Promise.all([
        invoiceQuery.skip(pagination.skip).limit(pagination.limit),
        Invoice.countDocuments(query),
    ]);

    return {
        items,
        total,
    };
}

export const findInvoiceForUpdate = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Invoice.findById(id);
};

export const saveInvoice = async (invoice: { save: () => Promise<unknown> }) => {
    return invoice.save();
};

export const createInvoiceRecord = async (data: Record<string, unknown>) => {
    return Invoice.create(data);
};

export const getInvoiceById = async (id: string, userId?: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const query: Record<string, unknown> = { _id: id };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        query.userId = new mongoose.Types.ObjectId(userId);
    }

    return Invoice.findOne(query)
        .populate('userId', 'name email mobile address')
        .lean();
};

export const getInvoiceByIdOrTransaction = async (id: string): Promise<IInvoice | null> => {
    return Invoice.findOne({
        $or: [{ _id: id }, { transactionId: id }]
    }).lean() as Promise<IInvoice | null>;
};

export const buildInvoicePayload = async (
    tx: ITransaction,
    session: ClientSession
) : Promise<{ invoiceData: Partial<IInvoice>; user: PaymentUserLike | null; business?: PaymentBusinessLike | null }> => {
    const user = await User.findById(tx.userId)
        .select('name email mobile location businessId')
        .session(session)
        .lean<PaymentUserLike | null>();

    let business: PaymentBusinessLike | null = null;
    if (user?.businessId) {
        business = await Business.findById(user.businessId).session(session).lean<PaymentBusinessLike | null>();
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
            invoiceNumber: await generateInvoiceNumber(session),
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
            sacCode: PAYMENT_SAC_CODE,
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

export const ensureInvoicePdf = async (invoiceId?: string) => {
    if (!invoiceId) return;

    const invoice = await Invoice.findById(invoiceId).lean();
    if (!invoice || invoice.pdfUrl) return;

    const user = await User.findById(invoice.userId).select('name email mobile location businessId').lean<PaymentUserLike | null>();
    let business: PaymentBusinessLike | null = null;
    if (user?.businessId) {
        business = await Business.findById(user.businessId).lean<PaymentBusinessLike | null>();
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

        const pdfUrl = await generateInvoicePdf({
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

        if (!pdfUrl) return;

        await Invoice.updateOne(
            { _id: invoice._id, pdfUrl: { $exists: false } },
            { $set: { pdfUrl } }
        );

        logBusiness('invoice_generated', {
            invoiceId: invoice._id.toString(),
            invoiceNumber: invoice.invoiceNumber,
            pdfUrl
        });
    } catch (error) {
        logger.error('Failed to generate invoice PDF after payment commit', {
            invoiceId: invoice._id.toString(),
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

