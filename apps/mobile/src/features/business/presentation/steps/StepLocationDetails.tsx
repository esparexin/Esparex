import React from 'react';
import { View, TextInput } from 'react-native';
import { Container, Card, AppText } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { BusinessFormState } from '../../domain/BusinessFormState';

interface StepLocationDetailsProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepLocationDetails({ formState, onChange }: StepLocationDetailsProps) {
  return (
    <Container className="p-4">
      <Card className="p-4 rounded-2xl bg-card border border-border">
        <AppText variant="h3" className="font-bold text-foreground mb-1">
          Shop & Location Address
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary mb-4">
          Provide your shop address for buyer discovery
        </AppText>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Shop / Street Address *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="Shop No. 12, Main Market Road"
            placeholderTextColor={base.slate[500]}
            value={formState.address}
            onChangeText={(text) => onChange({ address: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            City *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="e.g. Mumbai, New Delhi, Bengaluru"
            placeholderTextColor={base.slate[500]}
            value={formState.city}
            onChangeText={(text) => onChange({ city: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            State *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="e.g. Maharashtra, Karnataka"
            placeholderTextColor={base.slate[500]}
            value={formState.state}
            onChangeText={(text) => onChange({ state: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Pincode *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="6-digit PIN code"
            placeholderTextColor={base.slate[500]}
            keyboardType="number-pad"
            maxLength={6}
            value={formState.pincode}
            onChangeText={(text) => onChange({ pincode: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            GSTIN / Business Reg. No. (Optional)
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="e.g. 27AAAAA0000A1Z5"
            placeholderTextColor={base.slate[500]}
            autoCapitalize="characters"
            value={formState.gstNumber}
            onChangeText={(text) => onChange({ gstNumber: text })}
          />
        </View>
      </Card>
    </Container>
  );
}

