import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen, Container, Card, AppButton } from '@esparex/mobile-ui';
import { BUSINESS_STATUS, Business } from '@esparex/contracts';
import { semantic } from '@esparex/design-tokens';

interface BusinessStatusScreenProps {
  business: Business;
  onEdit?: () => void;
  onBack?: () => void;
}

export function BusinessStatusScreen({ business, onEdit, onBack }: BusinessStatusScreenProps) {
  const status = business.status;

  const renderStatusCard = () => {
    switch (status) {
      case BUSINESS_STATUS.PENDING:
        return (
          <Card style={[styles.card, styles.pendingCard]}>
            <Text style={styles.badgePending}>⌛ Verification Pending</Text>
            <Text style={styles.title}>{business.name}</Text>
            <Text style={styles.description}>
              Your business verification application has been submitted and is currently under review by our verification team.
            </Text>
            <Text style={styles.subtext}>Reviews are typically completed within 24 to 48 hours.</Text>
          </Card>
        );

      case BUSINESS_STATUS.ACTIVE:
      case BUSINESS_STATUS.LIVE:
      case BUSINESS_STATUS.APPROVED:
        return (
          <Card style={[styles.card, styles.activeCard]}>
            <Text style={styles.badgeActive}>✓ Verified Business</Text>
            <Text style={styles.title}>{business.name}</Text>
            <Text style={styles.description}>
              Your business is active and verified on the Esparex marketplace. Buyers can discover your listings with the official Business Badge.
            </Text>
          </Card>
        );

      case BUSINESS_STATUS.REJECTED:
        return (
          <Card style={[styles.card, styles.rejectedCard]}>
            <Text style={styles.badgeRejected}>❌ Application Rejected</Text>
            <Text style={styles.title}>{business.name}</Text>
            <Text style={styles.description}>
              {business.rejectionReason || 'Your application requires updated verification documents or additional shop location details.'}
            </Text>
            {onEdit && (
              <AppButton label="Update Application" onPress={onEdit} style={styles.editButton} />
            )}
          </Card>
        );

      default:
        return (
          <Card style={styles.card}>
            <Text style={styles.title}>{business.name}</Text>
            <Text style={styles.description}>Status: {status}</Text>
          </Card>
        );
    }
  };

  return (
    <Screen style={styles.screen}>
      <Container style={styles.container}>
        {renderStatusCard()}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: semantic.light.background }, // formerly #f8fafc
  container: { padding: 16 },
  card: { padding: 20, borderRadius: 20, backgroundColor: semantic.light.card }, // formerly #ffffff
  pendingCard: { borderLeftWidth: 4, borderLeftColor: semantic.light['warning-dark'] },
  activeCard: { borderLeftWidth: 4, borderLeftColor: semantic.light['success-dark'] },
  rejectedCard: { borderLeftWidth: 4, borderLeftColor: semantic.light['destructive-dark'] },
  badgePending: { fontSize: 13, fontWeight: '700', color: semantic.light['warning-dark'], marginBottom: 8 },
  badgeActive: { fontSize: 13, fontWeight: '700', color: semantic.light['success-dark'], marginBottom: 8 },
  badgeRejected: { fontSize: 13, fontWeight: '700', color: semantic.light['destructive-dark'], marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: semantic.light.foreground, marginBottom: 8 }, // formerly #0f172a
  description: { fontSize: 14, color: semantic.light['muted-foreground'], lineHeight: 20, marginBottom: 12 }, // formerly #475569
  subtext: { fontSize: 12, color: semantic.light.muted }, // formerly #94a3b8
  editButton: { marginTop: 12, backgroundColor: semantic.light.action },
});
