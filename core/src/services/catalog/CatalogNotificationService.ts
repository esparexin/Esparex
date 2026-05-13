import User from "../../models/User";
import { Role } from "../../constants/enums/roles";
import { NOTIFICATION_TYPE } from "../../constants/enums/notificationType";
import { NotificationIntent } from "../../domain/NotificationIntent";
import { NotificationDispatcher } from "../notification/NotificationDispatcher";
import logger from "../../utils/logger";

export class CatalogNotificationService {
    /**
     * Notify all admins about a new brand or model suggestion.
     */
    static async notifyAdminsOfSuggestion(type: 'brand' | 'model', name: string, suggestedBy: string, requestId?: string) {
        try {
            const admins = await User.find({ 
                role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] }, 
                isDeleted: { $ne: true } 
            }).select('_id');

            if (admins.length === 0) {
                logger.debug('[CatalogNotification] No admins found to notify of suggestion');
                return;
            }

            const title = `New ${type === 'brand' ? 'Brand' : 'Model'} Suggestion`;
            const body = `A new ${type} "${name}" has been suggested and is awaiting approval.`;
            const data = {
                kind: 'catalog_request_submitted',
                requestId,
                entityType: type,
                name,
                actionUrl: requestId ? `/catalog-requests/${requestId}` : '/catalog-requests?status=pending'
            };

            const promises = admins.map(admin => {
                const intent = new NotificationIntent({
                    userId: admin._id.toString(),
                    type: NOTIFICATION_TYPE.SYSTEM,
                    entityRef: { domain: 'catalog_suggestion', id: `${type}_${name}_${Date.now()}` },
                    message: { title, body, data },
                    priority: 'high'
                });
                return NotificationDispatcher.dispatch(intent);
            });

            await Promise.all(promises);
            logger.info(`[CatalogNotification] Notified ${admins.length} admins of new ${type} suggestion: ${name}`);
        } catch (error) {
            logger.error('[CatalogNotification] Failed to notify admins of suggestion', {
                error: error instanceof Error ? error.message : String(error),
                type,
                name
            });
        }
    }
}
