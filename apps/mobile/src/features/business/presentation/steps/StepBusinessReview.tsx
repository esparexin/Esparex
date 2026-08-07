import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Container, Card } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';
import { semantic } from '@esparex/design-tokens';

interface StepBusinessReviewProps {
  formState: BusinessFormState;
}

export function StepBusinessReview({ formState }: StepBusinessReviewProps) {
  return (
    <Container style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Review & Submit Application</Text>
        <Text style={styles.subtitle}>Verify your information before submitting for verification</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Business Details</Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name: </Text>
            <Text style={styles.detailVal}>{formState.name}</Text>
          </Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type: </Text>
            <Text style={styles.detailVal}>{formState.businessType}</Text>
          </Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile: </Text>
            <Text style={styles.detailVal}>{formState.mobile}</Text>
          </Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email: </Text>
            <Text style={styles.detailVal}>{formState.email}</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Shop Address</Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailVal}>
              {formState.address}, {formState.city}, {formState.state} - {formState.pincode}
            </Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Attached Verification Documents</Text>
          <Text style={styles.detailRow}>
            <Text style={styles.detailVal}>
              {formState.documents.length} document(s) uploaded
            </Text>
          </Text>
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
  section: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: semantic.light.border }, // formerly #f1f5f9
  sectionHeader: { fontSize: 14, fontWeight: '700', color: semantic.light.foreground, marginBottom: 6 }, // formerly #1e293b
  detailRow: { fontSize: 13, color: semantic.light['muted-foreground'], marginBottom: 3 }, // formerly #475569
  detailLabel: { fontWeight: '600', color: semantic.light['secondary-foreground'] }, // formerly #334155
  detailVal: { color: semantic.light.foreground }, // formerly #0f172a
});
