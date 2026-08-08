import React from 'react';
import { View, TextInput } from 'react-native';
import { Container, Card, AppText } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';

interface StepBusinessInfoProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepBusinessInfo({ formState, onChange }: StepBusinessInfoProps) {
  return (
    <Container className="p-4">
      <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100 mb-1">
          Business Overview
        </AppText>
        <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-4">
          Enter your official business name and contact information
        </AppText>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Business Name *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="e.g. Metro Electronics & Spare Parts"
            placeholderTextColor="#94a3b8"
            value={formState.name}
            onChangeText={(text) => onChange({ name: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Business Category / Type *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="e.g. Repair services, Spare parts"
            placeholderTextColor="#94a3b8"
            value={formState.businessType}
            onChangeText={(text) => onChange({ businessType: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Contact Mobile *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="10-digit mobile number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={10}
            value={formState.mobile}
            onChangeText={(text) => onChange({ mobile: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Contact Email *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="business@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formState.email}
            onChangeText={(text) => onChange({ email: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description (Optional)
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 h-20"
            style={{ textAlignVertical: 'top' }}
            placeholder="Describe your services, working hours, or specialized spare parts..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={formState.description}
            onChangeText={(text) => onChange({ description: text })}
          />
        </View>
      </Card>
    </Container>
  );
}

