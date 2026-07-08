import Business from '../../models/Business';
import Ad from '../../models/Ad';
import { GOVERNANCE, MS_IN_DAY } from '../../config/constants';
import { publishedBusinessStatusQuery } from '../../utils/businessStatus';
import { BUSINESS_STATUS } from '@esparex/shared';

export interface AdminBusinessPaginationParams {
    status?: string; locationId?: string; search?: string; page?: number; limit?: number;
    [key: string]: unknown;
}

export const getBusinessAccountsQuery = (status?: string) => {
    const adminQuery: Record<string, unknown> = {};
    const ns = status === 'approved' || status === 'active' ? BUSINESS_STATUS.LIVE : status;
    if (ns && ns !== 'all') {
        if (ns === 'expiring') { const seven = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); adminQuery.status = publishedBusinessStatusQuery; adminQuery.expiresAt = { $lte: seven, $gte: new Date() }; }
        else if (ns === BUSINESS_STATUS.DELETED) adminQuery.isDeleted = true;
        else adminQuery.status = ns;
    }
    return adminQuery;
};

export const getAdminBusinessAccountsData = (params: AdminBusinessPaginationParams) => {
    const adminQuery = getBusinessAccountsQuery(params.status);
    if (params.locationId) adminQuery.locationId = params.locationId;
    if (params.expiringIn3Days === 'true') { const w = new Date(Date.now() + 3 * MS_IN_DAY); adminQuery.expiresAt = { $lte: w, $gte: new Date() }; adminQuery.status = publishedBusinessStatusQuery; }
    if (params.warningSent === 'true') adminQuery.expiryWarningSentAt = { $exists: true, $ne: null };
    else if (params.warningNotSent === 'true') adminQuery.expiryWarningSentAt = { $exists: false };
    return Promise.resolve({ adminQuery });
};

export const transformBusinessDocs = (items: unknown[]): unknown[] =>
    items.map((doc) => { const s = require('../../utils/businessSerializer').serializeBusinessForAdmin(doc); return { ...s, businessPhone: s.mobile, businessEmail: s.email }; });
