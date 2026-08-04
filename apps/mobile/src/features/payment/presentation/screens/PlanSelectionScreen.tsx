import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Screen, Container, Card, AppButton } from '@esparex/mobile-ui';
import { Plan } from '@esparex/contracts';
import { usePaymentPlans } from '../hooks/usePaymentPlans';
import { useWalletSummary } from '../hooks/useWalletSummary';
import { useCheckoutPayment } from '../hooks/useCheckoutPayment';

interface PlanSelectionScreenProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function PlanSelectionScreen({ onSuccess, onBack }: PlanSelectionScreenProps) {
  const { data: plans, isLoading: loadingPlans } = usePaymentPlans();
  const { data: wallet } = useWalletSummary();
  const checkoutMutation = useCheckoutPayment();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handlePurchase = (plan: Plan) => {
    setSelectedPlanId(plan.id);

    checkoutMutation.mutate(
      { plan },
      {
        onSuccess: (result) => {
          Alert.alert(
            'Payment Successful',
            `Payment ID: ${result.razorpay_payment_id}\nYour ad credits have been added to your wallet!`,
            [
              {
                text: 'OK',
                onPress: () => onSuccess && onSuccess(),
              },
            ]
          );
        },
        onError: (err: any) => {
          if (err?.message?.toLowerCase().includes('cancelled')) {
            return; // User cancelled — silent exit
          }
          Alert.alert('Checkout Failed', err?.message || 'Unable to complete payment order. Please try again.');
        },
      }
    );
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Ad Credits & Wallet Plans</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Wallet Credit Badge Summary */}
        <Container style={styles.walletContainer}>
          <Card style={styles.walletCard}>
            <Text style={styles.walletTitle}>Your Credit Balances</Text>
            <View style={styles.walletRow}>
              <View style={styles.walletItem}>
                <Text style={styles.walletCount}>{wallet?.adCredits ?? 0}</Text>
                <Text style={styles.walletLabel}>Ad Credits</Text>
              </View>
              <View style={styles.walletItem}>
                <Text style={styles.walletCount}>{wallet?.spotlightCredits ?? 0}</Text>
                <Text style={styles.walletLabel}>Spotlight</Text>
              </View>
              <View style={styles.walletItem}>
                <Text style={styles.walletCount}>{wallet?.smartAlertSlots ?? 0}</Text>
                <Text style={styles.walletLabel}>Alert Slots</Text>
              </View>
            </View>
          </Card>
        </Container>

        {/* Plan Cards List */}
        <Container style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Available Credit Packages</Text>

          {loadingPlans && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          )}

          {plans && plans.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active credit packages available right now.</Text>
            </Card>
          )}

          {plans?.map((plan) => {
            const isProcessing = checkoutMutation.isPending && selectedPlanId === plan.id;
            return (
              <Card key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {plan.currency === 'INR' || !plan.currency ? '₹' : plan.currency}
                    {plan.price}
                  </Text>
                </View>

                {plan.description && <Text style={styles.planDesc}>{plan.description}</Text>}

                <View style={styles.planFeatures}>
                  <Text style={styles.featureItem}>✓ {plan.credits} Listing Credits included</Text>
                  {plan.durationDays && <Text style={styles.featureItem}>✓ Valid for {plan.durationDays} days</Text>}
                </View>

                <AppButton
                  label={isProcessing ? 'Processing...' : 'Buy Package'}
                  onPress={() => handlePurchase(plan)}
                  disabled={isProcessing}
                  style={styles.buyButton}
                />
              </Card>
            );
          })}
        </Container>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { flex: 1 },
  walletContainer: { padding: 16 },
  walletCard: { padding: 16, borderRadius: 16, backgroundColor: '#1e293b' },
  walletTitle: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 12 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between' },
  walletItem: { alignItems: 'center', flex: 1 },
  walletCount: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  walletLabel: { fontSize: 12, color: '#cbd5e1', marginTop: 2 },
  plansContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  loadingContainer: { padding: 32, alignItems: 'center' },
  emptyCard: { padding: 20, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#64748b' },
  planCard: { padding: 16, borderRadius: 16, backgroundColor: '#ffffff', marginBottom: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  planPrice: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  planDesc: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  planFeatures: { marginBottom: 14 },
  featureItem: { fontSize: 13, color: '#334155', marginBottom: 4 },
  buyButton: { backgroundColor: '#2563eb' },
});
