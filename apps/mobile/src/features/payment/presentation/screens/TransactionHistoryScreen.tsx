import React from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen, Container, Card, AppText, AppIcon, AppButton } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { PaymentTransaction } from '../../domain/PaymentTransaction';

interface TransactionHistoryScreenProps {
  onBack?: () => void;
}

export function TransactionHistoryScreen({ onBack }: TransactionHistoryScreenProps = {}) {
  const { status: authStatus } = useAuth();
  const { data: transactions, isLoading } = useQuery<PaymentTransaction[], Error>({
    queryKey: ['payment', 'history'],
    queryFn: () => services.paymentService.getTransactionHistory(),
    enabled: authStatus === 'authenticated',
    staleTime: 1000 * 60 * 5,
  });

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
            Purchase History
          </AppText>
        </View>
        <Container className="flex-1 p-4">
          <Card className="p-6 items-center mt-4">
            <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
              <AppIcon name="FileText" size={28} color={base.slate[400]} />
            </View>
            <AppText variant="h3" className="font-bold text-foreground text-center mb-1">
              Sign in to view purchase history
            </AppText>
            <AppText variant="body" className="text-foreground-subtle text-center mb-5">
              Access invoices and receipts for your credit purchases.
            </AppText>
            <AppButton
              label="Sign In / Register"
              onPress={() => navigate(ROUTES.AUTH_STACK)}
              className="w-full"
              accessibilityLabel="Sign in to view purchase history"
            />
          </Card>
        </Container>
      </Screen>
    );
  }

  const renderTransactionItem = ({ item }: { item: PaymentTransaction }) => {
    const isSuccess = item.status === 'SUCCESS';
    return (
      <Card className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-2.5">
        <View className="flex-row justify-between mb-1.5">
          <AppText variant="body" className="font-bold text-slate-900 dark:text-slate-100">
            {item.planName || 'Credit Purchase'}
          </AppText>
          <AppText variant="body" className="font-extrabold text-brand-600 dark:text-brand-400">
            ₹{item.amount}
          </AppText>
        </View>
        <View className="flex-row justify-between items-center">
          <AppText variant="caption" className="text-slate-500 dark:text-slate-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </AppText>
          <AppText
            variant="caption"
            className={`font-bold ${isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
          >
            {item.status}
          </AppText>
        </View>
      </Card>
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
          Purchase History
        </AppText>
      </View>

      <Container className="flex-1 p-4">
        {isLoading ? (
          <ActivityIndicator size="large" color={base.brand[500]} className="mt-8" />
        ) : (
          <FlatList
            data={transactions || []}
            keyExtractor={(item) => item.id || item.orderId}
            renderItem={renderTransactionItem}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={8}
            initialNumToRender={10}
            ListEmptyComponent={
              <Card className="p-5 rounded-xl bg-white dark:bg-slate-900 items-center border border-slate-200 dark:border-slate-800">
                <AppText variant="body" className="text-slate-500 dark:text-slate-400">
                  No previous credit purchases found.
                </AppText>
              </Card>
            }
          />
        )}
      </Container>
    </Screen>
  );
}

