import React, { useState } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen, Container, Card, AppButton, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { Plan } from '@esparex/contracts';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { usePaymentPlans } from '../hooks/usePaymentPlans';
import { useWalletSummary } from '../hooks/useWalletSummary';
import { useCheckoutPayment } from '../hooks/useCheckoutPayment';

interface PlanSelectionScreenProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function PlanSelectionScreen({ onSuccess, onBack }: PlanSelectionScreenProps) {
  const { status: authStatus } = useAuth();
  const { data: plans, isLoading: loadingPlans } = usePaymentPlans();
  const { data: wallet } = useWalletSummary();
  const checkoutMutation = useCheckoutPayment();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (authStatus === 'anonymous') {
    return (
      <Screen className="flex-1 bg-muted">
        <View className="flex-row items-center px-4 py-3.5 bg-card border-b border-border">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              accessibilityLabel="Back to profile"
              accessibilityRole="button"
              className="mr-3 p-1"
            >
              <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
            </TouchableOpacity>
          )}
          <AppText variant="h3" className="font-bold text-foreground">
            Ad Credits &amp; Wallet Plans
          </AppText>
        </View>
        <Container className="flex-1 p-4">
          <Card className="p-6 items-center mt-4">
            <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
              <AppIcon name="CreditCard" size={28} color={base.slate[400]} />
            </View>
            <AppText variant="h3" className="font-bold text-foreground text-center mb-1">
              Sign in to manage credits
            </AppText>
            <AppText variant="body" className="text-foreground-subtle text-center mb-5">
              Purchase ad posting credits, spotlight slots, and smart alert quotas.
            </AppText>
            <AppButton
              label="Sign In / Register"
              onPress={() => navigate(ROUTES.AUTH_STACK)}
              className="w-full"
              accessibilityLabel="Sign in to manage ad credits"
            />
          </Card>
        </Container>
      </Screen>
    );
  }

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
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-row items-center px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            accessibilityLabel="Back to profile"
            accessibilityRole="button"
            className="mr-3 p-1"
          >
            <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
          </TouchableOpacity>
        )}
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100">
          Ad Credits & Wallet Plans
        </AppText>
      </View>

      <ScrollView className="flex-1">
        {/* Wallet Credit Badge Summary */}
        <Container className="p-4">
          <Card className="p-4 rounded-2xl bg-slate-800 dark:bg-slate-900 border-none">
            <AppText variant="caption" className="font-semibold text-slate-300 mb-3">
              Your Credit Balances
            </AppText>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <AppText variant="h2" className="font-extrabold text-white">
                  {wallet?.adCredits ?? 0}
                </AppText>
                <AppText variant="caption" className="text-slate-400 mt-0.5">
                  Ad Credits
                </AppText>
              </View>
              <View className="items-center flex-1">
                <AppText variant="h2" className="font-extrabold text-white">
                  {wallet?.spotlightCredits ?? 0}
                </AppText>
                <AppText variant="caption" className="text-slate-400 mt-0.5">
                  Spotlight
                </AppText>
              </View>
              <View className="items-center flex-1">
                <AppText variant="h2" className="font-extrabold text-white">
                  {wallet?.smartAlertSlots ?? 0}
                </AppText>
                <AppText variant="caption" className="text-slate-400 mt-0.5">
                  Alert Slots
                </AppText>
              </View>
            </View>
          </Card>
        </Container>

        {/* Plan Cards List */}
        <Container className="px-4 pb-6">
          <AppText variant="h4" className="font-bold text-slate-900 dark:text-slate-100 mb-3">
            Available Credit Packages
          </AppText>

          {loadingPlans && (
            <View className="p-8 items-center">
              <ActivityIndicator size="large" color="#0284c7" />
            </View>
          )}

          {plans && plans.length === 0 && (
            <Card className="p-5 rounded-xl bg-white dark:bg-slate-900 items-center border-slate-200 dark:border-slate-800">
              <AppText variant="body" className="text-slate-500 dark:text-slate-400">
                No active credit packages available right now.
              </AppText>
            </Card>
          )}

          {plans?.map((plan) => {
            const isProcessing = checkoutMutation.isPending && selectedPlanId === plan.id;
            return (
              <Card key={plan.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-3">
                <View className="flex-row justify-between items-center mb-1.5">
                  <AppText variant="h4" className="font-bold text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </AppText>
                  <AppText variant="h3" className="font-extrabold text-brand-600 dark:text-brand-400">
                    {plan.currency === 'INR' || !plan.currency ? '₹' : plan.currency}
                    {plan.price}
                  </AppText>
                </View>

                {plan.description && (
                  <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-2.5">
                    {plan.description}
                  </AppText>
                )}

                <View className="mb-3.5">
                  <AppText variant="caption" className="text-slate-700 dark:text-slate-300 mb-1">
                    ✓ {plan.credits} Listing Credits included
                  </AppText>
                  {plan.durationDays && (
                    <AppText variant="caption" className="text-slate-700 dark:text-slate-300 mb-1">
                      ✓ Valid for {plan.durationDays} days
                    </AppText>
                  )}
                </View>

                <AppButton
                  label={isProcessing ? 'Processing...' : 'Buy Package'}
                  onPress={() => handlePurchase(plan)}
                  disabled={isProcessing}
                  variant="primary"
                />
              </Card>
            );
          })}
        </Container>
      </ScrollView>
    </Screen>
  );
}

