import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Container, Card } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';

interface StepBusinessInfoProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepBusinessInfo({ formState, onChange }: StepBusinessInfoProps) {
  return (
    <Container style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Business Overview</Text>
        <Text style={styles.subtitle}>Enter your official business name and contact information</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Metro Electronics & Spare Parts"
            value={formState.name}
            onChangeText={(text) => onChange({ name: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Business Category / Type *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Repair services, Spare parts"
            value={formState.businessType}
            onChangeText={(text) => onChange({ businessType: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contact Mobile *</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={formState.mobile}
            onChangeText={(text) => onChange({ mobile: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contact Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="business@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formState.email}
            onChangeText={(text) => onChange({ email: text })}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your services, working hours, or specialized spare parts..."
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

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 16, borderRadius: 16, backgroundColor: '#ffffff' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
});
