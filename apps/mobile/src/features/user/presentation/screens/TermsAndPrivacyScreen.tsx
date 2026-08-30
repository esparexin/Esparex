import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Screen, Container, Card, AppText } from '@esparex/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

export function TermsAndPrivacyScreen() {
  const navigation = useNavigation();

  return (
    <Screen className="flex-1 bg-background">
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 mr-2 rounded-lg bg-muted"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <AppText variant="h3" className="text-foreground font-bold">
          Terms &amp; Privacy Policy
        </AppText>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <Container className="mb-4">
          <AppText variant="h2" className="text-foreground font-bold mb-1">
            Esparex Marketplace Terms &amp; Privacy
          </AppText>
          <AppText variant="caption" className="text-foreground-subtle">
            Last Updated: August 26, 2026 | Effective Date: August 26, 2026
          </AppText>
        </Container>

        <Card className="p-4 mb-4 bg-card rounded-xl border border-border space-y-4">
          <View>
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              1. Platform Nature &amp; Intermediary Role
            </AppText>
            <AppText variant="body" className="text-foreground-secondary leading-6">
              Esparex operates strictly as an online marketplace intermediary under Section 79 of the Information Technology Act, 2000. We connect independent buyers, sellers, and repair technicians. Esparex does not own, manufacture, or warrant items listed by third parties. All trades, testing, and payments take place directly between users.
            </AppText>
          </View>

          <View>
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              2. User Eligibility (18+ Requirement)
            </AppText>
            <AppText variant="body" className="text-foreground-secondary leading-6">
              You must be at least 18 years of age and legally competent to enter into binding contracts under the Indian Contract Act, 1872 to create an account or post listings on Esparex.
            </AppText>
          </View>

          <View>
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              3. Safety &amp; In-Person Transactions
            </AppText>
            <AppText variant="body" className="text-foreground-secondary leading-6">
              Never send advance booking fees, courier deposits, or wire transfers to unverified sellers. Always meet in well-lit public locations or verified technician repair shops. Physically inspect and test all electronic components (touch sensitivity, dead pixels, battery health) before paying.
            </AppText>
          </View>

          <View>
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              4. Prohibited Content &amp; Goods
            </AppText>
            <AppText variant="body" className="text-foreground-secondary leading-6">
              Posting stolen phones/parts, counterfeit goods falsely labeled as OEM, devices with tampered IMEI numbers, iCloud/FRP bypass unlocking services, adult material, or weapons is strictly prohibited and results in immediate permanent bans.
            </AppText>
          </View>

          <View>
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              5. Paid Services &amp; No-Refund Policy
            </AppText>
            <AppText variant="body" className="text-foreground-secondary leading-6">
              Payments made for optional Spotlight ad promotions, featured listings, or business storefront subscriptions are non-refundable once the campaign is activated or served on the platform.
            </AppText>
          </View>

          <View>
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              6. Privacy, Data Retention &amp; Deletion
            </AppText>
            <AppText variant="body" className="text-foreground-secondary leading-6">
              We never sell your personal information. Mobile numbers are authenticated via OTP and visibility can be configured in Profile Settings. You can permanently delete your account and personal data at any time under Profile Settings &gt; Delete Account.
            </AppText>
          </View>

          <View className="pt-2 border-t border-border">
            <AppText variant="h3" className="text-foreground font-semibold mb-1">
              7. Statutory Grievance Redressal
            </AppText>
            <AppText variant="caption" className="text-foreground-secondary leading-5">
              Grievance Officer: Kalyan V Medaboina{'\n'}
              Entity: Esparex Platform (Hyderabad, Telangana, India){'\n'}
              Email: grievance@esparex.in | Phone: +91 9030787819{'\n'}
              Timelines: Grievance reports are acknowledged within 24 hours and addressed within 15 days.
            </AppText>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
