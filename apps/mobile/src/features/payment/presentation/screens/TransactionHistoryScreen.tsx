import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Screen, Container, Card } from '@esparex/mobile-ui';
import { useQuery } from '@tanstack/react-query';
import { ApiPaymentRepository } from '../../application/ApiPaymentRepository';
import { PaymentService } from '../../application/PaymentService';
import { PaymentTransaction } from '../../domain/PaymentTransaction';

const paymentService = new PaymentService(new ApiPaymentRepository());

export function TransactionHistoryScreen() {
  const { data: transactions, isLoading } = useQuery<PaymentTransaction[], Error>({
    queryKey: ['payment', 'history'],
    queryFn: () => paymentService.getTransactionHistory(),
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
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <FlatList
            data={transactions || []}
            keyExtractor={(item) => item.id || item.orderId}
            renderItem={renderTransactionItem}
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
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  container: { flex: 1, padding: 16 },
  loader: { marginTop: 32 },
  itemCard: { padding: 14, borderRadius: 12, backgroundColor: '#ffffff', marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  planName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  amount: { fontSize: 15, fontWeight: '800', color: '#2563eb' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#64748b' },
  status: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  statusSuccess: { color: '#16a34a' },
  statusPending: { color: '#d97706' },
  emptyCard: { padding: 20, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#64748b' },
});
