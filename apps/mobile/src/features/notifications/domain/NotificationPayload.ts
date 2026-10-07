/**
 * Phase 3a (§5): the local `PushNotificationPayload` / `NotificationResponse`
 * interfaces are relocated to `@esparex/contracts` (canonical owner per
 * DECISION-GATE §3) and re-exported here so existing importers keep working.
 *
 * CONFLICT (recorded, not merged): the local `NotificationResponse` (device
 * tap interaction { actionIdentifier, notification }) collides by name with
 * the web's `NotificationResponse` (notification list) in
 * `apps/web/src/lib/api/user/notifications.ts:22`. The canonical names are
 * `PushNotificationActionResponse` (this file's historic shape) and
 * `NotificationListResponse` (web's shape). Deletion of this shim — and any
 * rename to the canonical names — is Phase 4 (§10).
 */
export type { PushNotificationPayload } from '@esparex/contracts';
export type { PushNotificationActionResponse as NotificationResponse } from '@esparex/contracts';
