import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Container, Card } from '@esparex/mobile-ui';
import { BusinessFormState } from '../../domain/BusinessFormState';

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
  card: { padding: 16, borderRadius: 16, backgroundColor: '#ffffff' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  section: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  detailRow: { fontSize: 13, color: '#475569', marginBottom: 3 },
  detailLabel: { fontWeight: '600', color: '#334155' },
  detailVal: { color: '#0f172a' },
});
