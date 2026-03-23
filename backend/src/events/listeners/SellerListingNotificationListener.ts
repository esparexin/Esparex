import logger from '../../utils/logger';
import { lifecycleEvents } from '../LifecycleEventDispatcher';
import { emailService } from '../../services/EmailService';
import Ad from '../../models/Ad';
import User from '../../models/User';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://esparex.com';

const LISTING_TYPE_LABEL: Record<string, string> = {
    service: 'Service',
    spare_part: 'Spare Part',
    spare_part_listing: 'Spare Part',
    ad: 'Ad',
};

async function getSellerEmail(listingId: string): Promise<{ email: string; name: string; title: string; listingType: string } | null> {
    try {
        const listing = await Ad.findById(listingId).select('sellerId title listingType').lean() as any;
        if (!listing) return null;
        const user = await User.findById(listing.sellerId).select('email name').lean() as any;
        if (!user?.email) return null;
        return { email: user.email, name: user.name || 'Seller', title: listing.title || 'Your listing', listingType: listing.listingType || 'ad' };
    } catch (e) {
        logger.warn('[SellerNotification] Failed to resolve seller email', { listingId, error: String(e) });
        return null;
    }
}

export const registerSellerListingNotificationListener = () => {
    // Approval
    lifecycleEvents.on('listing.approved', async (payload) => {
        try {
            const info = await getSellerEmail(payload.listingId);
            if (!info) return;
            const typeLabel = LISTING_TYPE_LABEL[info.listingType] || 'Listing';
            const subject = `Your ${typeLabel} is Live on Esparex!`;
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #16a34a;">Your listing is approved!</h2>
                    <p>Hi <strong>${info.name}</strong>,</p>
                    <p>Great news! Your ${typeLabel.toLowerCase()} <strong>${info.title}</strong> has been approved and is now live on Esparex.</p>
                    <br/>
                    <a href="${FRONTEND_URL}/account/profile" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View My Listings</a>
                </div>
            `;
            await emailService.sendEmail(info.email, subject, html);
            logger.info('[SellerNotification] Approval email sent', { listingId: payload.listingId, listingType: info.listingType });
        } catch (e) {
            logger.error('[SellerNotification] Failed to send approval email', { error: String(e), listingId: payload.listingId });
        }
    }, 'SellerNotification_Approved');

    // Rejection
    lifecycleEvents.on('listing.rejected', async (payload) => {
        try {
            const info = await getSellerEmail(payload.listingId);
            if (!info) return;
            const typeLabel = LISTING_TYPE_LABEL[payload.listingType] || LISTING_TYPE_LABEL[info.listingType] || 'Listing';
            const subject = `Your ${typeLabel} Needs Attention — Esparex`;
            const reasonNote = payload.rejectionReason
                ? `<p><strong>Reason:</strong> ${payload.rejectionReason}</p>`
                : '';
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #dc2626;">Listing not approved</h2>
                    <p>Hi <strong>${info.name}</strong>,</p>
                    <p>Unfortunately, your ${typeLabel.toLowerCase()} <strong>${info.title}</strong> did not pass our review.</p>
                    ${reasonNote}
                    <p>Please review the feedback, make the necessary changes, and resubmit.</p>
                    <br/>
                    <a href="${FRONTEND_URL}/account/profile" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View My Listings</a>
                </div>
            `;
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
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <h2 style="color: #d97706;">Listing expired</h2>
                        <p>Hi <strong>${info.name}</strong>,</p>
                        <p>Your ${typeLabel.toLowerCase()} <strong>${info.title}</strong> has expired and is no longer visible to buyers.</p>
                        <p>Log in to renew it and keep your listing active.</p>
                        <br/>
                        <a href="${FRONTEND_URL}/account/profile" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Listing</a>
                    </div>
                `;
                await emailService.sendEmail(info.email, subject, html);
            } catch (e) {
                logger.error('[SellerNotification] Failed to send expiry email', { error: String(e), listingId });
            }
        }
        logger.info('[SellerNotification] Expiry emails processed', { count: Math.min(payload.listingIds.length, 50) });
    }, 'SellerNotification_Expired');

    logger.info('[SellerListingNotification] Listener registered successfully.');
};
