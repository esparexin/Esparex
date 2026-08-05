import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Screen, Container, Card, AppButton } from '@esparex/mobile-ui';
import { useSmartAlertsList } from '../hooks/useSmartAlertsList';
import { useDeleteSmartAlert } from '../hooks/useDeleteSmartAlert';
import { CreateSmartAlertModal } from '../components/CreateSmartAlertModal';
import { SmartAlert } from '../../domain/SmartAlert';

interface SmartAlertsScreenProps {
  onUpgradePlan?: () => void;
}

export function SmartAlertsScreen({ onUpgradePlan }: SmartAlertsScreenProps) {
  const { data: alerts, isLoading } = useSmartAlertsList();
  const deleteMutation = useDeleteSmartAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SmartAlert | null>(null);

  const handleDelete = (alertItem: SmartAlert) => {
    Alert.alert('Delete Smart Alert', `Are you sure you want to delete "${alertItem.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(alertItem.id),
      },
    ]);
  };

  const renderAlertItem = ({ item }: { item: SmartAlert }) => (
    <Card style={styles.alertCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.alertName}>{item.name}</Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          accessibilityRole="button"
          accessibilityLabel={`Delete smart alert ${item.name}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {item.criteria?.keywords && <Text style={styles.criteriaText}>Keywords: {item.criteria.keywords}</Text>}
      {item.criteria?.category && <Text style={styles.criteriaText}>Category: {item.criteria.category}</Text>}
      {item.criteria?.location && <Text style={styles.criteriaText}>Location: {item.criteria.location}</Text>}

      <View style={styles.cardFooter}>
        <Text style={styles.frequencyText}>🔔 {item.frequency === 'instant' ? 'Instant Push' : 'Daily Digest'}</Text>
      </View>
    </Card>
  );

  return (
    <Screen style={styles.screen}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Smart Search Alerts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingAlert(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.addText}>+ New Alert</Text>
        </TouchableOpacity>
      </View>

      <Container style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : (
          <FlatList
            data={alerts || []}
            keyExtractor={(item) => item.id}
            renderItem={renderAlertItem}
            ListEmptyComponent={
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Active Smart Alerts</Text>
                <Text style={styles.emptySubtitle}>
                  Create a smart alert to receive instant push notifications when matching spare parts or listings are posted.
                </Text>
                <AppButton
                  label="Create Smart Alert"
                  onPress={() => {
                    setEditingAlert(null);
                    setModalVisible(true);
                  }}
                  style={styles.createButton}
                />
              </Card>
            }
          />
        )}
      </Container>

      <CreateSmartAlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialAlert={editingAlert}
        onQuotaExceeded={onUpgradePlan}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  addButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  container: { flex: 1, padding: 16 },
  loader: { marginTop: 32 },
  alertCard: { padding: 16, borderRadius: 14, backgroundColor: '#ffffff', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  alertName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  deleteText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  criteriaText: { fontSize: 13, color: '#475569', marginBottom: 3 },
  cardFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  frequencyText: { fontSize: 12, fontWeight: '600', color: '#0284c7' },
  emptyCard: { padding: 24, borderRadius: 16, backgroundColor: '#ffffff', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  createButton: { backgroundColor: '#2563eb' },
});
