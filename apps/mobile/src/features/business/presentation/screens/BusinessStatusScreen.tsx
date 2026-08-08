import React from 'react';
import { View } from 'react-native';
import { Screen, Container, Card, AppButton, AppText } from '@esparex/mobile-ui';
import { BUSINESS_STATUS, Business } from '@esparex/contracts';

interface BusinessStatusScreenProps {
  business: Business;
  onEdit?: () => void;
  onBack?: () => void;
}

export function BusinessStatusScreen({ business, onEdit }: BusinessStatusScreenProps) {
  const status = business.status;

  const renderStatusCard = () => {
    switch (status) {
      case BUSINESS_STATUS.PENDING:
        return (
          <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200 dark:border-slate-800">
            <AppText variant="caption" className="font-bold text-amber-600 dark:text-amber-400 mb-2">
              ⌛ Verification Pending
            </AppText>
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-slate-600 dark:text-slate-400 leading-5 mb-3">
              Your business verification application has been submitted and is currently under review by our verification team.
            </AppText>
            <AppText variant="caption" className="text-slate-400 dark:text-slate-500">
              Reviews are typically completed within 24 to 48 hours.
            </AppText>
          </Card>
        );

      case BUSINESS_STATUS.ACTIVE:
      case BUSINESS_STATUS.LIVE:
      case BUSINESS_STATUS.APPROVED:
        return (
          <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 border-t border-r border-b border-slate-200 dark:border-slate-800">
            <AppText variant="caption" className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              ✓ Verified Business
            </AppText>
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-slate-600 dark:text-slate-400 leading-5">
              Your business is active and verified on the Esparex marketplace. Buyers can discover your listings with the official Business Badge.
            </AppText>
          </Card>
        );

      case BUSINESS_STATUS.REJECTED:
        return (
          <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 border-t border-r border-b border-slate-200 dark:border-slate-800">
            <AppText variant="caption" className="font-bold text-rose-600 dark:text-rose-400 mb-2">
              ❌ Application Rejected
            </AppText>
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-slate-600 dark:text-slate-400 leading-5 mb-3">
              {business.rejectionReason || 'Your application requires updated verification documents or additional shop location details.'}
            </AppText>
            {onEdit && (
              <AppButton label="Update Application" onPress={onEdit} className="mt-3 bg-brand-600 hover:bg-brand-700" />
            )}
          </Card>
        );

      default:
        return (
          <Card className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <AppText variant="h2" className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-xl">
              {business.name}
            </AppText>
            <AppText variant="body" className="text-slate-600 dark:text-slate-400">
              Status: {status}
            </AppText>
          </Card>
        );
    }
  };

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <Container className="p-4">
        {renderStatusCard()}
      </Container>
    </Screen>
  );
}

