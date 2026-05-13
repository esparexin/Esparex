
export interface NotificationTemplate {
    title: string;
    body: string;
}

export type TemplateParams = Record<string, string | number | undefined>;

/**
 * Registry of notification templates to eliminate hardcoded strings.
 */
const TEMPLATES: Record<string, (params: TemplateParams) => NotificationTemplate> = {
    BUSINESS_APPROVED: (p) => ({
        title: 'Business Profile Approved! 🏢',
        body: `Congratulations! Your business "${p.name}" has been approved. You can now post ads as a business.`
    }),
    BUSINESS_REJECTED: (p) => ({
        title: 'Business Profile Rejected ⚠️',
        body: `Your business application for "${p.name}" was not approved. Reason: ${p.reason || 'Incomplete documentation'}.`
    }),
    BUSINESS_REMOVED: (p) => ({
        title: 'Business Account Removed',
        body: `Your business "${p.name}" has been removed by an administrator.`
    }),
    BUSINESS_EXPIRING_SOON: (p) => ({
        title: 'Business Expiring Soon ⚠️',
        body: `Your business "${p.name}" will expire on ${p.date}. Renew now to keep your listings active.`
    }),
    BUSINESS_EXPIRY_WARNING_3D: (p) => ({
        title: 'Business Renewal Reminder 🏢',
        body: `Your business profile "${p.name}" expires in 3 days (${p.date}). Renew today to avoid any service interruption.`
    }),
    LISTING_EXPIRY_WARNING_3D: (p) => ({
        title: 'Listing Expiring Soon 🏷️',
        body: `Your listing "${p.title}" will expire in 3 days (${p.date}). Renew it now to keep it visible to buyers.`
    }),
    SMART_ALERT_EXPIRY_WARNING_3D: (p) => ({
        title: 'Search Alert Expiring 🔍',
        body: `Your smart alert "${p.name || 'Saved Search'}" expires in 3 days. Extend it now to continue receiving matches.`
    }),
    SPOTLIGHT_EXPIRY_WARNING_3D: (p) => ({
        title: 'Spotlight Expiring Soon 🚀',
        body: `Your spotlight promotion for "${p.title}" expires in 3 days. Renew it to stay at the top of search results.`
    }),
    BUSINESS_SUSPENDED: (p) => ({
        title: 'Business Account Suspended',
        body: `Your business "${p.name}" has expired and been suspended. Contact support to renew your listing.`
    }),
    SMART_ALERT: (p) => ({
        title: 'New listing matches your saved search.',
        body: `${p.adTitle} • \u20B9${p.price} • ${p.location}`
    }),
    PRICE_DROP: (p) => ({
        title: 'Price Drop! 💸',
        body: `An item you followed "${p.adTitle}" is now \u20B9${p.price}. Catch it before someone else does!`
    }),
    NEW_CHAT_MESSAGE: (p) => ({
        title: `New Message from ${p.senderName || 'User'}`,
        body: String(p.text || 'Sent an attachment')
    }),
    LOCATION_APPROVED: (p) => ({
        title: 'Location Request Approved',
        body: `Your location request for "${p.name}" has been approved.`
    }),
    LOCATION_REJECTED: (p) => ({
        title: 'Location Request Rejected',
        body: `Your location request for "${p.name}" has been rejected. Reason: ${p.reason || 'Incomplete data'}`
    }),
    SYSTEM_ALERT: (p) => ({
        title: String(p.title || 'System Alert'),
        body: String(p.message || p.body || '')
    }),
    CATALOG_ITEM_APPROVED: (p) => ({
        title: 'Catalog Request Approved',
        body: 'Your requested catalog item has been approved. Your listing is now back in moderation review.'
    })
};

export const getNotificationTemplate = (
    templateKey: string,
    params: TemplateParams = {}
): NotificationTemplate => {
    const templateFn = TEMPLATES[templateKey];
    if (!templateFn) {
        // Fallback to raw params if template not found (prevents breakage during migration)
        return {
            title: String(params.title || templateKey),
            body: String(params.body || params.message || '')
        };
    }
    return templateFn(params);
};
