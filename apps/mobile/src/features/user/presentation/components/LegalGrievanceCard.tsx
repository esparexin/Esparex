import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { Card, AppText, AppIcon, AppButton, Badge } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import {
  LEGAL_COMPANY_NAME,
  LEGAL_COMPANY_LOCATION,
  LEGAL_SUPPORT_EMAIL,
  LEGAL_GRIEVANCE_EMAIL,
  LEGAL_SUPPORT_PHONE,
  LEGAL_GRIEVANCE_OFFICER,
  LEGAL_GRIEVANCE_DESIGNATION,
  LEGAL_TIMELINES_ACKNOWLEDGMENT,
  LEGAL_TIMELINES_DISPOSAL,
  LEGAL_JURISDICTION,
  LEGAL_WEB_TERMS_URL,
  LEGAL_WEB_PRIVACY_URL,
} from '@esparex/shared';

export const LegalGrievanceCard: React.FC = () => {
  const handleEmailGrievance = () => {
    Linking.openURL(
      `mailto:${LEGAL_GRIEVANCE_EMAIL}?subject=${encodeURIComponent('Grievance Redressal Request - Esparex')}`
    ).catch(() => {});
  };

  const handleCallGrievance = () => {
    Linking.openURL(`tel:${LEGAL_SUPPORT_PHONE.replace(/\s+/g, '')}`).catch(() => {});
  };

  const handleOpenWebTerms = () => {
    Linking.openURL(LEGAL_WEB_TERMS_URL).catch(() => {});
  };

  const handleOpenWebPrivacy = () => {
    Linking.openURL(LEGAL_WEB_PRIVACY_URL).catch(() => {});
  };

  return (
    <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-3">
      <View className="flex-row items-center justify-between mb-1">
        <AppText variant="h3" className="text-foreground font-semibold flex-1">
          7. Statutory Grievance Redressal
        </AppText>
        <Badge label="Compliance" variant="success" size="sm" />
      </View>
      <AppText variant="body" className="text-foreground-secondary leading-6">
        In accordance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020:
      </AppText>

      <View className="p-3 bg-muted/40 rounded-lg border border-border gap-1.5">
        <AppText variant="caption" className="text-foreground font-semibold">
          Designated Grievance Officer: {LEGAL_GRIEVANCE_OFFICER}
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary">
          Role: {LEGAL_GRIEVANCE_DESIGNATION}
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary">
          Entity: {LEGAL_COMPANY_NAME} ({LEGAL_COMPANY_LOCATION})
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary">
          Email: {LEGAL_GRIEVANCE_EMAIL} | Support: {LEGAL_SUPPORT_EMAIL}
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary">
          Phone: {LEGAL_SUPPORT_PHONE}
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary">
          Timelines: Acknowledged {LEGAL_TIMELINES_ACKNOWLEDGMENT} | Disposal {LEGAL_TIMELINES_DISPOSAL}
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary">
          Jurisdiction: {LEGAL_JURISDICTION}
        </AppText>
      </View>

      {/* Direct Contact Actions */}
      <View className="gap-2 pt-2">
        <AppButton
          variant="outline"
          size="sm"
          label="Email Grievance Officer"
          onPress={handleEmailGrievance}
          accessibilityLabel="Email the Grievance Officer"
          accessibilityRole="button"
          leftIcon={<AppIcon name="Mail" size={16} color={base.brand[500]} />}
        />
        <AppButton
          variant="outline"
          size="sm"
          label="Call Grievance Officer"
          onPress={handleCallGrievance}
          accessibilityLabel="Call the Grievance Officer"
          accessibilityRole="button"
          leftIcon={<AppIcon name="Phone" size={16} color={base.brand[500]} />}
        />
      </View>

      {/* Official Web Links */}
      <View className="pt-2 border-t border-border flex-row justify-between">
        <TouchableOpacity
          onPress={handleOpenWebTerms}
          accessibilityRole="link"
          accessibilityLabel="Open Full Terms of Service on Web"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppText variant="caption" className="text-brand-600 dark:text-brand-400 font-semibold underline">
            Full Terms on Web
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleOpenWebPrivacy}
          accessibilityRole="link"
          accessibilityLabel="Open Full Privacy Policy on Web"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppText variant="caption" className="text-brand-600 dark:text-brand-400 font-semibold underline">
            Full Privacy Policy on Web
          </AppText>
        </TouchableOpacity>
      </View>
    </Card>
  );
};
