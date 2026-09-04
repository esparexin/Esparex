import React from 'react';
import { View } from 'react-native';
import { Card, AppText, AppIcon, Badge } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { LEGAL_COMPANY_NAME } from '@esparex/shared';

export type LegalFilterTab = 'all' | 'terms' | 'privacy' | 'safety_grievance';

interface LegalContentSectionsProps {
  activeFilter: LegalFilterTab;
}

export const LegalContentSections: React.FC<LegalContentSectionsProps> = ({ activeFilter }) => {
  const isSectionVisible = (sectionCategory: 'terms' | 'privacy' | 'safety_grievance') => {
    return activeFilter === 'all' || activeFilter === sectionCategory;
  };

  return (
    <>
      {/* Section 1: Platform Nature & Intermediary Role */}
      {isSectionVisible('terms') && (
        <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-2">
          <View className="flex-row items-center justify-between mb-1">
            <AppText variant="h3" className="text-foreground font-semibold flex-1">
              1. Platform Nature &amp; Intermediary Role
            </AppText>
            <Badge label="Terms" variant="brand" size="sm" />
          </View>
          <AppText variant="body" className="text-foreground-secondary leading-6">
            {LEGAL_COMPANY_NAME} operates strictly as an online marketplace intermediary under Section 79 of the Information Technology Act, 2000. We provide technical infrastructure to connect independent buyers, individual sellers, and professional electronics repair technicians. Esparex does not own, manufacture, warrant, or take title/custody of items listed by third parties. All negotiations, testing, inspections, and payments take place directly between users.
          </AppText>
        </Card>
      )}

      {/* Section 2: User Eligibility (18+ Requirement) */}
      {isSectionVisible('terms') && (
        <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-2">
          <View className="flex-row items-center justify-between mb-1">
            <AppText variant="h3" className="text-foreground font-semibold flex-1">
              2. User Eligibility (18+ Requirement)
            </AppText>
            <Badge label="Eligibility" variant="default" size="sm" />
          </View>
          <AppText variant="body" className="text-foreground-secondary leading-6">
            You must be at least 18 years of age and legally competent to enter into binding contracts under the Indian Contract Act, 1872 to create an account or post listings on Esparex. Users under 18 may access the Platform only under the direct supervision and consent of a parent or legal guardian who agrees to be bound by these Terms.
          </AppText>
        </Card>
      )}

      {/* Section 3: Safety & In-Person Inspection */}
      {isSectionVisible('safety_grievance') && (
        <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-2 flex-1">
              <AppIcon name="Shield" size={18} color={base.warning[500]} />
              <AppText variant="h3" className="text-foreground font-semibold">
                3. Safety &amp; In-Person Inspection
              </AppText>
            </View>
            <Badge label="Safety Advisory" variant="warning" size="sm" />
          </View>
          <AppText variant="body" className="text-foreground-secondary leading-6">
            Never send advance booking fees, courier deposits, or wire transfers to unverified sellers. Always meet in well-lit public locations or verified technician repair workshops. Physically inspect and test all electronic components (touch sensitivity, dead pixels, battery health, IMEI matching) before handing over payment.
          </AppText>
          <View className="p-3 bg-muted/50 rounded-lg border border-border">
            <AppText variant="caption" className="text-foreground-secondary font-medium leading-5">
              Notice: Esparex does not provide escrow, courier collection, or buyer protection warranties for peer-to-peer cash transactions.
            </AppText>
          </View>
        </Card>
      )}

      {/* Section 4: Prohibited Content & Goods */}
      {isSectionVisible('terms') && (
        <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-2">
          <View className="flex-row items-center justify-between mb-1">
            <AppText variant="h3" className="text-foreground font-semibold flex-1">
              4. Prohibited Content &amp; Goods
            </AppText>
            <Badge label="Enforcement" variant="error" size="sm" />
          </View>
          <AppText variant="body" className="text-foreground-secondary leading-6">
            In accordance with Rule 3(1)(b) of the IT Rules 2021, posting stolen devices/parts, counterfeit goods falsely labeled as OEM, devices with tampered or altered IMEI/serial numbers, iCloud/FRP bypass unlocking services, adult content, malicious software, or weapons is strictly prohibited and results in immediate account suspension and referral to law enforcement where mandated.
          </AppText>
        </Card>
      )}

      {/* Section 5: Paid Promotions & No-Refund Policy */}
      {isSectionVisible('terms') && (
        <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-2">
          <View className="flex-row items-center justify-between mb-1">
            <AppText variant="h3" className="text-foreground font-semibold flex-1">
              5. Paid Promotions &amp; No-Refund Policy
            </AppText>
            <Badge label="Billing" variant="default" size="sm" />
          </View>
          <AppText variant="body" className="text-foreground-secondary leading-6">
            Payments made for optional Spotlight promotions, featured listing placements, or business subscription packages are processed via secure authorized payment gateways. All promotional service fees are non-refundable once the campaign is activated or rendered on the platform.
          </AppText>
        </Card>
      )}

      {/* Section 6: Privacy, Data Protection & Account Deletion */}
      {isSectionVisible('privacy') && (
        <Card className="p-4 mb-4 bg-card rounded-xl border border-border gap-2">
          <View className="flex-row items-center justify-between mb-1">
            <AppText variant="h3" className="text-foreground font-semibold flex-1">
              6. Privacy, DPDP Act 2023 &amp; Account Deletion
            </AppText>
            <Badge label="Privacy" variant="brand" size="sm" />
          </View>
          <AppText variant="body" className="text-foreground-secondary leading-6">
            We never sell your personal information to third parties. Mobile phone numbers are collected solely for passwordless OTP authentication and account recovery. In compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act), you have the right to request data correction or permanent deletion at any time via Profile Settings &gt; Delete Account.
          </AppText>
        </Card>
      )}
    </>
  );
};
