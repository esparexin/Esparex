import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Screen, Container, Card } from '@esparex/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { PaymentTransaction } from '../../domain/PaymentTransaction';
import { semantic } from '@esparex/design-tokens';

export function TransactionHistoryScreen() {
  const { data: transactions, isLoading } = useQuery<PaymentTransaction[], Error>({
    queryKey: ['payment', 'history'],
    queryFn: () => services.paymentService.getTransactionHistory(),
    staleTime: 1000 * 60 * 5,
  });

  const renderTransactionItem = ({ item }: { item: PaymentTransaction }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.planName}>{item.planName || 'Credit Purchase'}</Text>
        <Text style={styles.amount}>₹{item.amount}</Text>
      </View>
      <View style={styles.itemFooter}>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={[styles.status, item.status === 'SUCCESS' ? styles.statusSuccess : styles.statusPending]}>
          {item.status}
        </Text>
      </View>
    </Card>
  );

  return (
    <Screen style={styles.screen}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Purchase History</Text>
      </View>

      <Container style={styles.container}>
        {isLoading ? (
          // eslint-disable-next-line react-native/no-color-literals
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
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
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No previous credit purchases found.</Text>
              </Card>
            }
          />
        )}
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: semantic.light.background }, // formerly #f8fafc
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: semantic.light.card, // formerly #ffffff
    borderBottomWidth: 1,
    borderBottomColor: semantic.light.border, // formerly #e2e8f0
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: semantic.light.foreground }, // formerly #0f172a
  container: { flex: 1, padding: 16 },
  loader: { marginTop: 32 },
  itemCard: { padding: 14, borderRadius: 12, backgroundColor: semantic.light.card, marginBottom: 10 }, // formerly #ffffff
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  planName: { fontSize: 15, fontWeight: '700', color: semantic.light.foreground }, // formerly #0f172a
  amount: { fontSize: 15, fontWeight: '800', color: semantic.light.action },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: semantic.light['muted-foreground'] }, // formerly #64748b
  status: { fontSize: 12, fontWeight: '700', color: semantic.light['muted-foreground'] }, // formerly #64748b
  statusSuccess: { color: semantic.light['success-dark'] },
  statusPending: { color: semantic.light['warning-dark'] },
  emptyCard: { padding: 20, borderRadius: 12, backgroundColor: semantic.light.card, alignItems: 'center' }, // formerly #ffffff
  emptyText: { fontSize: 14, color: semantic.light['muted-foreground'] }, // formerly #64748b
});
