import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { Screen, Container, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useNavigation } from '@react-navigation/native';
import {
  LEGAL_LAST_UPDATED,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_COMPANY_NAME,
  LEGAL_COMPANY_LOCATION,
} from '@esparex/shared';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { LegalGrievanceCard } from '../components/LegalGrievanceCard';
import { LegalContentSections, LegalFilterTab } from '../components/LegalContentSections';

interface FilterPill {
  id: LegalFilterTab;
  label: string;
}

const FILTER_PILLS: FilterPill[] = [
  { id: 'all', label: 'All' },
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'safety_grievance', label: 'Safety & Grievance' },
];

export function TermsAndPrivacyScreen() {
  const navigation = useNavigation();
  const parentNav = navigation.getParent();
  const [activeFilter, setActiveFilter] = useState<LegalFilterTab>('all');

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (parentNav?.canGoBack()) {
      parentNav.goBack();
    } else {
      navigate(ROUTES.MAIN_STACK);
    }
  }, [navigation, parentNav]);

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [handleBack]);

  const showGrievance = activeFilter === 'all' || activeFilter === 'safety_grievance';

  return (
    <Screen className="flex-1 bg-background">
      {/* Top App Bar with Accessible Back Navigation */}
      <View className="px-4 py-3 bg-card border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={handleBack}
            className="w-11 h-11 rounded-full items-center justify-center mr-3 bg-muted active:opacity-70"
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Returns to previous screen or marketplace"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
          </TouchableOpacity>
          <View className="flex-1">
            <AppText variant="h3" className="text-foreground font-bold" numberOfLines={1}>
              Terms &amp; Privacy Policy
            </AppText>
            <AppText variant="caption" className="text-foreground-subtle" numberOfLines={1}>
              Legal Governance &amp; Compliance
            </AppText>
          </View>
        </View>
      </View>

      {/* Segmented Filter Pills */}
      <View className="bg-card border-b border-border py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          accessibilityRole="tablist"
        >
          {FILTER_PILLS.map((pill) => {
            const isSelected = activeFilter === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                onPress={() => setActiveFilter(pill.id)}
                accessibilityRole="tab"
                accessibilityLabel={`Filter by ${pill.label}`}
                accessibilityState={{ selected: isSelected }}
                className={`px-3.5 py-1.5 rounded-full border min-h-[36px] items-center justify-center ${
                  isSelected
                    ? 'bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                    : 'bg-card border-border'
                }`}
              >
                <AppText
                  variant="caption"
                  className={`font-semibold ${
                    isSelected ? 'text-white' : 'text-foreground-secondary'
                  }`}
                >
                  {pill.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <Container className="mb-4">
          <AppText variant="h2" className="text-foreground font-bold mb-1">
            Esparex Marketplace Terms &amp; Privacy
          </AppText>
          <AppText variant="caption" className="text-foreground-subtle">
            Last Updated: {LEGAL_LAST_UPDATED} | Effective Date: {LEGAL_EFFECTIVE_DATE}
          </AppText>
        </Container>

        {/* Modular Sections 1 - 6 */}
        <LegalContentSections activeFilter={activeFilter} />

        {/* Section 7: Statutory Grievance Redressal Card */}
        {showGrievance && <LegalGrievanceCard />}

        <View className="py-6 items-center">
          <AppText variant="caption" className="text-foreground-subtle text-center">
            {LEGAL_COMPANY_NAME} &bull; {LEGAL_COMPANY_LOCATION}
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}
