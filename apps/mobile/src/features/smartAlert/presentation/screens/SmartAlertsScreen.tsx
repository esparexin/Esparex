import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Screen, Container, Card, AppButton, AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useSmartAlertsList } from '../hooks/useSmartAlertsList';
import { useDeleteSmartAlert } from '../hooks/useDeleteSmartAlert';
import { CreateSmartAlertModal } from '../components/CreateSmartAlertModal';
import { SmartAlert } from '../../domain/SmartAlert';

interface SmartAlertsScreenProps {
  onUpgradePlan?: () => void;
  onBack?: () => void;
}

export function SmartAlertsScreen({ onUpgradePlan, onBack }: SmartAlertsScreenProps) {
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
    <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-3">
      <View className="flex-row justify-between items-center mb-1.5">
        <AppText variant="body" className="font-bold text-slate-900 dark:text-slate-100 text-base">
          {item.name}
        </AppText>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          accessibilityRole="button"
          accessibilityLabel={`Delete smart alert ${item.name}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppText variant="caption" className="font-semibold text-rose-600 dark:text-rose-400">
            Delete
          </AppText>
        </TouchableOpacity>
      </View>

      {item.criteria?.keywords && (
        <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-0.5">
          Keywords: {item.criteria.keywords}
        </AppText>
      )}
      {item.criteria?.category && (
        <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-0.5">
          Category: {item.criteria.category}
        </AppText>
      )}
      {item.criteria?.location && (
        <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-0.5">
          Location: {item.criteria.location}
        </AppText>
      )}

      <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <AppText variant="caption" className="font-semibold text-brand-600 dark:text-brand-400">
          🔔 {item.frequency === 'instant' ? 'Instant Push' : 'Daily Digest'}
        </AppText>
      </View>
    </Card>
  );

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-row items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <View className="flex-row items-center">
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
            Smart Search Alerts
          </AppText>
        </View>
        <TouchableOpacity
          className="bg-brand-600 dark:bg-brand-500 px-3 py-1.5 rounded-lg"
          onPress={() => {
            setEditingAlert(null);
            setModalVisible(true);
          }}
        >
          <AppText variant="caption" className="font-bold text-white">
            + New Alert
          </AppText>
        </TouchableOpacity>
      </View>

      <Container className="flex-1 p-4">
        {isLoading ? (
          <ActivityIndicator size="large" color={base.brand[500]} className="mt-8" />
        ) : (
          <FlatList
            data={alerts || []}
            keyExtractor={(item) => item.id}
            renderItem={renderAlertItem}
            ListEmptyComponent={
              <Card className="p-6 rounded-2xl bg-white dark:bg-slate-900 items-center border border-slate-200 dark:border-slate-800">
                <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-center">
                  No Active Smart Alerts
                </AppText>
                <AppText variant="body" className="text-slate-500 dark:text-slate-400 text-center mb-4 leading-5">
                  Create a smart alert to receive instant push notifications when matching spare parts or listings are posted.
                </AppText>
                <AppButton
                  label="Create Smart Alert"
                  onPress={() => {
                    setEditingAlert(null);
                    setModalVisible(true);
                  }}
                  className="bg-brand-600 hover:bg-brand-700"
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

