import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Screen, Container, Card, AppButton, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { BUSINESS_STATUS, Business } from '@esparex/contracts';

interface BusinessStatusScreenProps {
  business: Business;
  onEdit?: () => void;
  onBack?: () => void;
}

export function BusinessStatusScreen({ business, onEdit, onBack }: BusinessStatusScreenProps) {
  const status = business.status;

  const renderStatusCard = () => {
    switch (status) {
      case BUSINESS_STATUS.PENDING:
        return (
          <Card className="p-5 rounded-2xl bg-card border-l-4 border-l-amber-500 border-t border-r border-b border-border">
            <AppText variant="caption" className="font-bold text-amber-600 dark:text-amber-400 mb-2">
              ⌛ Verification Pending
            </AppText>
            <AppText variant="h2" className="font-bold text-foreground mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-foreground-subtle leading-5 mb-3">
              Your business verification application has been submitted and is currently under review by our verification team.
            </AppText>
            <AppText variant="caption" className="text-foreground-subtle">
              Reviews are typically completed within 24 to 48 hours.
            </AppText>
            {onEdit && (
              <AppButton
                label="Update Application"
                onPress={onEdit}
                variant="outline"
                className="mt-4"
                accessibilityLabel="Update application details"
              />
            )}
          </Card>
        );

      case BUSINESS_STATUS.ACTIVE:
      case BUSINESS_STATUS.LIVE:
      case BUSINESS_STATUS.APPROVED:
        return (
          <Card className="p-5 rounded-2xl bg-card border-l-4 border-l-emerald-500 border-t border-r border-b border-border">
            <AppText variant="caption" className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              ✓ Verified Business
            </AppText>
            <AppText variant="h2" className="font-bold text-foreground mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-foreground-subtle leading-5">
              Your business is active and verified on the Esparex marketplace. Buyers can discover your listings with the official Business Badge.
            </AppText>
            {onEdit && (
              <AppButton
                label="Edit Business Profile"
                onPress={onEdit}
                className="mt-4"
                accessibilityLabel="Edit business profile"
              />
            )}
          </Card>
        );

      case BUSINESS_STATUS.REJECTED:
        return (
          <Card className="p-5 rounded-2xl bg-card border-l-4 border-l-rose-500 border-t border-r border-b border-border">
            <AppText variant="caption" className="font-bold text-rose-600 dark:text-rose-400 mb-2">
              ❌ Application Rejected
            </AppText>
            <AppText variant="h2" className="font-bold text-foreground mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-foreground-subtle leading-5 mb-3">
              {business.rejectionReason || 'Your application requires updated verification documents or additional shop location details.'}
            </AppText>
            {onEdit && (
              <AppButton label="Update Application" onPress={onEdit} className="mt-3 bg-brand-600 hover:bg-brand-700" />
            )}
          </Card>
        );

      default:
        return (
          <Card className="p-5 rounded-2xl bg-card border border-border">
            <AppText variant="h2" className="font-bold text-foreground mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-foreground-subtle">
              Status: {status}
            </AppText>
          </Card>
        );
    }
  };

  return (
    <Screen className="flex-1 bg-muted">
      <View className="flex-row items-center px-4 py-3.5 bg-card border-b border-border">
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            accessibilityLabel="Back to profile"
            accessibilityRole="button"
            className="mr-3 p-1 min-h-[44px] min-w-[44px] items-center justify-center"
          >
            <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
          </TouchableOpacity>
        )}
        <AppText variant="h3" className="font-bold text-foreground">
          Business Status
        </AppText>
      </View>
      <Container className="p-4">
        {renderStatusCard()}
      </Container>
    </Screen>
  );
}

