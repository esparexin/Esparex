import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Screen, Container, Card, AppText } from '@esparex/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

export function TermsAndPrivacyScreen() {
  const navigation = useNavigation();

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 mr-2 rounded-lg bg-slate-100 dark:bg-slate-800"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <AppText variant="h3" className="text-slate-900 dark:text-white font-bold">
          Terms & Privacy Policy
        </AppText>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <Container className="mb-4">
          <AppText variant="h2" className="text-slate-900 dark:text-white font-bold mb-1">
            Esparex Marketplace Terms
          </AppText>
          <AppText variant="caption" className="text-slate-500 dark:text-slate-400">
            Last Updated: August 2026
          </AppText>
        </Container>

        <Card className="p-4 mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <AppText variant="h3" className="text-slate-900 dark:text-white font-semibold mb-2">
            1. Safety & Transaction Policy
          </AppText>
          <AppText variant="body" className="text-slate-600 dark:text-slate-300 leading-6 mb-4">
            Esparex provides a localized marketplace platform enabling buyers and sellers to discover used goods, spare parts, and verified business listings. Never send advance payment, wire transfers, or gift card codes prior to physically inspecting items.
          </AppText>

          <AppText variant="h3" className="text-slate-900 dark:text-white font-semibold mb-2">
            2. Content & Listing Rules
          </AppText>
          <AppText variant="body" className="text-slate-600 dark:text-slate-300 leading-6 mb-4">
            All user-submitted listings are subject to automated AI image and text moderation. Postings containing prohibited goods, counterfeit items, misleading descriptions, or offensive content are automatically flagged and removed.
          </AppText>

          <AppText variant="h3" className="text-slate-900 dark:text-white font-semibold mb-2">
            3. Privacy & Data Protection
          </AppText>
          <AppText variant="body" className="text-slate-600 dark:text-slate-300 leading-6 mb-2">
            Your personal data, contact details, and location coordinates are protected under strict security standards. We do not sell your personal information to third-party ad networks. You may request account or data deletion at any time via Profile Settings.
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}
