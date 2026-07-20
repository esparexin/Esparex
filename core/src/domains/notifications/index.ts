export * from './application/NotificationService';
export * from './application/AdminNotificationService';
export * from './application/EmailService';
export * from './application/SmartAlertQueryService';
export * from './application/SmartAlertService';
export * from './application/SmartAlertMutationService';
export * from './application/NotificationDispatcher';
export * from './application/NotificationPreferenceService';
export * from './application/NotificationRetentionService';
export * from './application/NotificationTemplateService';
export * from './application/PushGatewayService';

export * from './ports/NotificationRepositoryPort';
export * from './ports/SmartAlertRepositoryPort';

// Note: Adapters and detailed application services remain internal, exported selectively above.
