import React from 'react';
import { View, TextInput } from 'react-native';
import { Container, Card, AppText } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { BusinessFormState } from '../../domain/BusinessFormState';

interface StepBusinessInfoProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepBusinessInfo({ formState, onChange }: StepBusinessInfoProps) {
  return (
    <Container className="p-4">
      <Card className="p-4 rounded-2xl bg-card border border-border">
        <AppText variant="h3" className="font-bold text-foreground mb-1">
          Business Overview
        </AppText>
        <AppText variant="caption" className="text-foreground-secondary mb-4">
          Enter your official business name and contact information
        </AppText>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Business Name *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="e.g. Metro Electronics & Spare Parts"
            placeholderTextColor={base.slate[500]}
            value={formState.name}
            onChangeText={(text) => onChange({ name: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Business Category / Type *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="e.g. Repair services, Spare parts"
            placeholderTextColor={base.slate[500]}
            value={formState.businessType}
            onChangeText={(text) => onChange({ businessType: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Contact Mobile *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="10-digit mobile number"
            placeholderTextColor={base.slate[500]}
            keyboardType="phone-pad"
            maxLength={10}
            value={formState.mobile}
            onChangeText={(text) => onChange({ mobile: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Contact Email *
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background"
            placeholder="business@example.com"
            placeholderTextColor={base.slate[500]}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formState.email}
            onChangeText={(text) => onChange({ email: text })}
          />
        </View>

        <View className="mb-3.5">
          <AppText variant="caption" className="font-semibold text-foreground-secondary mb-1.5">
            Description (Optional)
          </AppText>
          <TextInput
            className="border border-border rounded-xl px-3 py-2.5 text-body-lg text-foreground bg-background h-20"
            style={{ textAlignVertical: 'top' }}
            placeholder="Describe your services, working hours, or specialized spare parts..."
            placeholderTextColor={base.slate[500]}
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

