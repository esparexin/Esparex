import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Container, Card } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';
import { semantic } from '@esparex/design-tokens';

interface StepLocationDetailsProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepLocationDetails({ formState, onChange }: StepLocationDetailsProps) {
  return (
    <Container style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Shop & Location Address</Text>
        <Text style={styles.subtitle}>Provide your shop address for buyer discovery</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Shop / Street Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Shop No. 12, Main Market Road"
            placeholderTextColor={semantic.light.muted}
            value={formState.address}
            onChangeText={(text) => onChange({ address: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Mumbai, New Delhi, Bengaluru"
            placeholderTextColor={semantic.light.muted}
            value={formState.city}
            onChangeText={(text) => onChange({ city: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Maharashtra, Karnataka"
            placeholderTextColor={semantic.light.muted}
            value={formState.state}
            onChangeText={(text) => onChange({ state: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit PIN code"
            placeholderTextColor={semantic.light.muted}
            keyboardType="number-pad"
            maxLength={6}
            value={formState.pincode}
            onChangeText={(text) => onChange({ pincode: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>GSTIN / Business Reg. No. (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 27AAAAA0000A1Z5"
            placeholderTextColor={semantic.light.muted}
            autoCapitalize="characters"
            value={formState.gstNumber}
            onChangeText={(text) => onChange({ gstNumber: text })}
          />
        </View>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 16, borderRadius: 16, backgroundColor: semantic.light.card }, // formerly #ffffff
  title: { fontSize: 18, fontWeight: '700', color: semantic.light.foreground, marginBottom: 4 }, // formerly #0f172a
  subtitle: { fontSize: 13, color: semantic.light['muted-foreground'], marginBottom: 16 }, // formerly #64748b
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: semantic.light['secondary-foreground'], marginBottom: 6 }, // formerly #334155
  input: {
    borderWidth: 1,
    borderColor: semantic.light.border, // formerly #cbd5e1
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: semantic.light.foreground, // formerly #0f172a
    backgroundColor: semantic.light.background, // formerly #f8fafc
  },
});
