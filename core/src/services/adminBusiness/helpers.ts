import mongoose from 'mongoose';
import { MS_IN_DAY } from '../../config/constants';
import { publishedBusinessStatusQuery } from '../../utils/businessStatus';
import { BUSINESS_STATUS, BUSINESS_STATUS_VALUES } from '@esparex/contracts';

export interface AdminBusinessPaginationParams {
    status?: string; locationId?: string; search?: string; page?: number; limit?: number;
    [key: string]: unknown;
}

const VALID_BUSINESS_STATUS_SET = new Set<string>([
    ...BUSINESS_STATUS_VALUES,
    'approved',
    'active',
    'all',
]);

export const getBusinessAccountsQuery = (status?: string) => {
    const adminQuery: Record<string, unknown> = {};
    if (!status) return adminQuery;

    const normalized = status.trim().toLowerCase();
    if (!VALID_BUSINESS_STATUS_SET.has(normalized)) {
        adminQuery._id = { $in: [] };
        return adminQuery;
    }

    const ns = normalized === 'approved' || normalized === 'active' ? BUSINESS_STATUS.LIVE : normalized;
    if (ns !== 'all') {
        if (ns === BUSINESS_STATUS.DELETED) adminQuery.isDeleted = true;
        else adminQuery.status = ns;
    }
    return adminQuery;
};

export const getAdminBusinessAccountsData = (params: AdminBusinessPaginationParams) => {
    const adminQuery = getBusinessAccountsQuery(params.status);
    if (params.locationId) {
        const trimmedLocationId = String(params.locationId).trim();
        if (trimmedLocationId) {
            if (mongoose.Types.ObjectId.isValid(trimmedLocationId)) {
                adminQuery.locationId = new mongoose.Types.ObjectId(trimmedLocationId);
            } else {
                adminQuery._id = { $in: [] };
            }
        }
    }
    if (params.expiringIn3Days === 'true') {
        const w = new Date(Date.now() + 3 * MS_IN_DAY);
        adminQuery.expiresAt = { $lte: w, $gte: new Date() };
        adminQuery.status = publishedBusinessStatusQuery;
    }
    if (params.warningSent === 'true' && params.warningNotSent === 'true') {
        adminQuery._id = { $in: [] };
    } else if (params.warningSent === 'true') {
        adminQuery.expiryWarningSentAt = { $exists: true, $ne: null };
    } else if (params.warningNotSent === 'true') {
        adminQuery.expiryWarningSentAt = { $in: [null, undefined] };
    }
    return Promise.resolve({ adminQuery });
};

export const transformBusinessDocs = (items: unknown[]): unknown[] =>
    items.map((doc) => { const s = require('../../utils/businessSerializer').serializeBusinessForAdmin(doc); return { ...s, businessPhone: s.mobile, businessEmail: s.email }; });
