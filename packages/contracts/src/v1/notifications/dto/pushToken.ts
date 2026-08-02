/**
 * RegisterPushTokenRequestDTO
 *
 * Contract for registering a device push token with the backend.
 * Consumed by:
 *  - POST /api/v1/notifications/register
 *  - Mobile ApiPushTokenRegistrationService
 */
export interface RegisterPushTokenRequestDTO {
  readonly token: string;
  readonly platform: 'web' | 'android' | 'ios';
}
