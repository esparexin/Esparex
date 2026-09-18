import mongoose from 'mongoose';
import { getBusinessAccountsQuery, getAdminBusinessAccountsData } from '../../services/adminBusiness/helpers';
import { BUSINESS_STATUS } from '@esparex/contracts';
import { MS_IN_DAY } from '../../config/constants';

describe('AdminBusinessQueryIntegrity — Backend Query Generation', () => {
    describe('getBusinessAccountsQuery', () => {
        it('returns empty query for undefined/null status (matches all statuses)', () => {
            expect(getBusinessAccountsQuery()).toEqual({});
            expect(getBusinessAccountsQuery(undefined)).toEqual({});
        });

        it('returns empty query for explicit "all" status', () => {
            expect(getBusinessAccountsQuery('all')).toEqual({});
            expect(getBusinessAccountsQuery('ALL')).toEqual({});
        });

        it('returns status=live for "live"', () => {
            expect(getBusinessAccountsQuery('live')).toEqual({ status: BUSINESS_STATUS.LIVE });
        });

        it('normalizes historical "approved" and "active" to status=live', () => {
            expect(getBusinessAccountsQuery('approved')).toEqual({ status: BUSINESS_STATUS.LIVE });
            expect(getBusinessAccountsQuery('active')).toEqual({ status: BUSINESS_STATUS.LIVE });
        });

        it('returns status=pending for "pending"', () => {
            expect(getBusinessAccountsQuery('pending')).toEqual({ status: BUSINESS_STATUS.PENDING });
        });

        it('returns status=suspended for "suspended"', () => {
            expect(getBusinessAccountsQuery('suspended')).toEqual({ status: BUSINESS_STATUS.SUSPENDED });
        });

        it('returns isDeleted=true for "deleted"', () => {
            expect(getBusinessAccountsQuery(BUSINESS_STATUS.DELETED)).toEqual({ isDeleted: true });
        });

        it('safely handles unknown or malicious status by returning empty set', () => {
            expect(getBusinessAccountsQuery('malicious_status')).toEqual({ _id: { $in: [] } });
            expect(getBusinessAccountsQuery('expiring')).toEqual({ _id: { $in: [] } });
        });
    });

    describe('getAdminBusinessAccountsData', () => {
        it('uses documented 3-day window for expiringIn3Days=true', async () => {
            const before = new Date(Date.now() + 3 * MS_IN_DAY);
            const { adminQuery } = await getAdminBusinessAccountsData({ expiringIn3Days: 'true' });
            const after = new Date(Date.now() + 3 * MS_IN_DAY);

            expect(adminQuery.status).toBeDefined();
            const expiresAt = adminQuery.expiresAt as { $lte: Date; $gte: Date };
            expect(expiresAt).toBeDefined();
            expect(expiresAt.$lte.getTime()).toBeGreaterThanOrEqual(before.getTime() - 100);
            expect(expiresAt.$lte.getTime()).toBeLessThanOrEqual(after.getTime() + 100);
        });

        it('correctly matches both null and missing expiryWarningSentAt for warningNotSent=true', async () => {
            const { adminQuery } = await getAdminBusinessAccountsData({ warningNotSent: 'true' });
            expect(adminQuery.expiryWarningSentAt).toEqual({ $in: [null, undefined] });
        });

        it('correctly matches non-null existing expiryWarningSentAt for warningSent=true', async () => {
            const { adminQuery } = await getAdminBusinessAccountsData({ warningSent: 'true' });
            expect(adminQuery.expiryWarningSentAt).toEqual({ $exists: true, $ne: null });
        });

        it('safely rejects conflicting warningSent=true and warningNotSent=true with empty set', async () => {
            const { adminQuery } = await getAdminBusinessAccountsData({
                warningSent: 'true',
                warningNotSent: 'true',
            });
            expect(adminQuery._id).toEqual({ $in: [] });
        });

        it('safely validates locationId ObjectId to prevent broad query leakage', async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const validResult = await getAdminBusinessAccountsData({ locationId: validId });
            expect(validResult.adminQuery.locationId).toEqual(new mongoose.Types.ObjectId(validId));

            const invalidResult = await getAdminBusinessAccountsData({ locationId: 'invalid-id' });
            expect(invalidResult.adminQuery._id).toEqual({ $in: [] });
        });
    });
});
