import Invoice from '../models/Invoice';
import mongoose from 'mongoose';

export interface InvoiceFilters {
    search?: string;
    status?: string;
}

/**
 * Service for querying and managing invoices.
 */
export const getInvoices = async (filters: InvoiceFilters = {}, limit: number = 100) => {
    const query: Record<string, unknown> = {};

    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    if (filters.search) {
        query.invoiceNumber = { $regex: filters.search, $options: 'i' };
    }

    return Invoice.find(query)
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

export const getInvoiceById = async (id: string) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    
    return Invoice.findById(id)
        .populate('userId', 'name email mobile address')
        .lean();
};
