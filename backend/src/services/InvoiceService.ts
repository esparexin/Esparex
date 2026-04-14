import Invoice from '../models/Invoice';
import mongoose from 'mongoose';
import User from '../models/User';
import { escapeRegExp } from '../utils/stringUtils';

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
