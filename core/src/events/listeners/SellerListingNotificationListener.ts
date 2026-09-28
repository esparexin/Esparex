import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import { emailService } from '../../domains/notifications/application/EmailService';
import {
    renderListingApprovedEmail,
    renderListingRejectedEmail,
    renderListingExpiredEmail,
} from '../../domains/notifications/templates/EmailLayout';
import Ad from '../../models/Ad';
import User from '../../models/User';
import { getFrontendAppUrl } from '../../utils/appUrl';

const FRONTEND_URL = getFrontendAppUrl();

const LISTING_TYPE_LABEL: Record<string, string> = {
    service: 'Service',
    spare_part: 'Spare Part',
    spare_part_listing: 'Spare Part',
    ad: 'Ad',
};

async function getSellerEmail(listingId: string): Promise<{ email: string; name: string; title: string; listingType: string } | null> {
    try {
        const listing = await Ad.findById(listingId).select('sellerId title listingType').lean() as { sellerId?: unknown; title?: string; listingType?: string } | null;
        if (!listing) return null;
        const user = await User.findById(listing.sellerId).select('email name').lean() as { email?: string; name?: string } | null;
        if (!user?.email) return null;
        return { email: user.email, name: user.name || 'Seller', title: listing.title || 'Your listing', listingType: listing.listingType || 'ad' };
    } catch (e) {
        logger.warn('[SellerNotification] Failed to resolve seller email', { listingId, error: String(e) });
        return null;
    }
}

const processedEvents = new Set<string>();

function tryReserveSlot(key: string): boolean {
    if (processedEvents.has(key)) return false;
    processedEvents.add(key);
    if (processedEvents.size > 2000) {
        const first = processedEvents.values().next().value;
        if (first !== undefined) processedEvents.delete(first);
    }
    return true;
}

export const registerSellerListingNotificationListener = () => {
    // Approval
    lifecycleEvents.on('listing.approved', async (payload) => {
        try {
            const dedupeKey = `seller_approved:${payload.listingId}`;
            if (!tryReserveSlot(dedupeKey)) return;

            const info = await getSellerEmail(payload.listingId);
            if (!info) return;
            const typeLabel = LISTING_TYPE_LABEL[info.listingType] || 'Listing';
            const subject = `Your ${typeLabel} is Live on Esparex!`;
            const html = renderListingApprovedEmail({
                name: info.name,
                title: info.title,
                listingType: typeLabel,
                viewUrl: `${FRONTEND_URL}/account/profile`,
            });
            await emailService.sendEmail(info.email, subject, html);
            logger.info('[SellerNotification] Approval email sent', { listingId: payload.listingId, listingType: info.listingType });
        } catch (e) {
            logger.error('[SellerNotification] Failed to send approval email', { error: String(e), listingId: payload.listingId });
        }
    }, 'SellerNotification_Approved');

    // Rejection
    lifecycleEvents.on('listing.rejected', async (payload) => {
        try {
            const dedupeKey = `seller_rejected:${payload.listingId}`;
            if (!tryReserveSlot(dedupeKey)) return;

            const info = await getSellerEmail(payload.listingId);
            if (!info) return;
            const typeLabel = LISTING_TYPE_LABEL[payload.listingType] || LISTING_TYPE_LABEL[info.listingType] || 'Listing';
            const subject = `Your ${typeLabel} Needs Attention — Esparex`;
            const html = renderListingRejectedEmail({
                name: info.name,
                title: info.title,
                listingType: typeLabel,
                rejectionReason: payload.rejectionReason,
                viewUrl: `${FRONTEND_URL}/account/profile`,
            });
            await emailService.sendEmail(info.email, subject, html);
            logger.info('[SellerNotification] Rejection email sent', { listingId: payload.listingId });
        } catch (e) {
            logger.error('[SellerNotification] Failed to send rejection email', { error: String(e), listingId: payload.listingId });
        }
    }, 'SellerNotification_Rejected');

    // Expiry (bulk)
    lifecycleEvents.on('listing.expired.bulk', async (payload) => {
        if (!payload.listingIds || payload.listingIds.length === 0) return;
        // Process in small batches to avoid hammering the email service
        for (const listingId of payload.listingIds.slice(0, 50)) {
            try {
                const info = await getSellerEmail(listingId);
                if (!info) continue;
                const typeLabel = LISTING_TYPE_LABEL[info.listingType] || 'Listing';
                const subject = `Your ${typeLabel} has Expired — Esparex`;
                const html = renderListingExpiredEmail({
                    name: info.name,
                    title: info.title,
                    listingType: typeLabel,
                    renewUrl: `${FRONTEND_URL}/account/profile`,
                });
                await emailService.sendEmail(info.email, subject, html);
            } catch (e) {
                logger.error('[SellerNotification] Failed to send expiry email', { error: String(e), listingId });
            }
        }
        logger.info('[SellerNotification] Expiry emails processed', { count: Math.min(payload.listingIds.length, 50) });
    }, 'SellerNotification_Expired');

    logger.info('[SellerListingNotification] Listener registered successfully.');
};
