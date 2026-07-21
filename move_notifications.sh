#!/bin/bash

# Define paths
SRC="core/src/services"
DOMAIN="core/src/domains/notifications"
APP="$DOMAIN/application"
POLICIES="$DOMAIN/domain/policies"

# 1. Move root notification services
git mv $SRC/AdminNotificationService.ts $APP/
git mv $SRC/EmailService.ts $APP/
git mv $SRC/NotificationService.ts $APP/
git mv $SRC/SmartAlertQueryService.ts $APP/
git mv $SRC/SmartAlertService.ts $APP/

# 2. Move contents of notification/ directory
git mv $SRC/notification/AdminNotificationTargetingService.ts $APP/
git mv $SRC/notification/NotificationDispatcher.ts $APP/
git mv $SRC/notification/NotificationPreferenceService.ts $APP/
git mv $SRC/notification/NotificationRetentionService.ts $APP/
git mv $SRC/notification/NotificationTemplateService.ts $APP/
git mv $SRC/notification/NotificationVersionService.ts $APP/
git mv $SRC/notification/PushGatewayService.ts $APP/

# 3. Move contents of smartAlert/ directory
git mv $SRC/smartAlert/SmartAlertMutationService.ts $APP/

echo "Files moved successfully."
