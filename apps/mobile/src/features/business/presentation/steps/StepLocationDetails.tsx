import React from 'react';
import { View, TextInput } from 'react-native';
import { Container, Card, AppText } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';

interface StepLocationDetailsProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepLocationDetails({ formState, onChange }: StepLocationDetailsProps) {
  return (
    <Container className="p-4">
      <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100 mb-1">
          Shop & Location Address
        </AppText>
        <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-4">
          Provide your shop address for buyer discovery
        </AppText>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Shop / Street Address *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="Shop No. 12, Main Market Road"
            placeholderTextColor="#94a3b8"
            value={formState.address}
            onChangeText={(text) => onChange({ address: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            City *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="e.g. Mumbai, New Delhi, Bengaluru"
            placeholderTextColor="#94a3b8"
            value={formState.city}
            onChangeText={(text) => onChange({ city: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            State *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="e.g. Maharashtra, Karnataka"
            placeholderTextColor="#94a3b8"
            value={formState.state}
            onChangeText={(text) => onChange({ state: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Pincode *
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="6-digit PIN code"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={6}
            value={formState.pincode}
            onChangeText={(text) => onChange({ pincode: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            GSTIN / Business Reg. No. (Optional)
          </AppText>
          <TextInput
            className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950"
            placeholder="e.g. 27AAAAA0000A1Z5"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            value={formState.gstNumber}
            onChangeText={(text) => onChange({ gstNumber: text })}
          />
        </View>
      </Card>
    </Container>
  );
}

