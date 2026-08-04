import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Card, AppButton } from '@esparex/mobile-ui';
import { SmartAlertFormState, INITIAL_SMART_ALERT_FORM_STATE } from '../../domain/SmartAlertFormState';
import { useCreateSmartAlert } from '../hooks/useCreateSmartAlert';
import { SmartAlert } from '../../domain/SmartAlert';

interface CreateSmartAlertModalProps {
  visible: boolean;
  onClose: () => void;
  initialAlert?: SmartAlert | null;
  onQuotaExceeded?: () => void;
}

export function CreateSmartAlertModal({
  visible,
  onClose,
  initialAlert,
  onQuotaExceeded,
}: CreateSmartAlertModalProps) {
  const [formState, setFormState] = useState<SmartAlertFormState>(INITIAL_SMART_ALERT_FORM_STATE);
  const createMutation = useCreateSmartAlert();

  useEffect(() => {
    if (initialAlert) {
      setFormState({
        name: initialAlert.name || '',
        keywords: initialAlert.criteria?.keywords || '',
        category: initialAlert.criteria?.category || '',
        minPrice: initialAlert.criteria?.minPrice ? String(initialAlert.criteria.minPrice) : '',
        maxPrice: initialAlert.criteria?.maxPrice ? String(initialAlert.criteria.maxPrice) : '',
        location: initialAlert.criteria?.location || '',
        radiusKm: initialAlert.radiusKm || 25,
        frequency: initialAlert.frequency || 'instant',
      });
    } else {
      setFormState(INITIAL_SMART_ALERT_FORM_STATE);
    }
  }, [initialAlert, visible]);

  const handleSubmit = () => {
    if (!formState.name.trim() && !formState.keywords.trim() && !formState.category.trim()) {
      Alert.alert('Validation Error', 'Please specify an alert name, search keyword, or category.');
      return;
    }

    if (formState.minPrice && formState.maxPrice) {
      const minP = parseFloat(formState.minPrice);
      const maxP = parseFloat(formState.maxPrice);
      if (maxP < minP) {
        Alert.alert('Validation Error', 'Maximum price must be greater than or equal to minimum price.');
        return;
      }
    }

    createMutation.mutate(formState, {
      onSuccess: () => {
        Alert.alert('Smart Alert Created', 'You will receive instant push notifications when matching ads are posted.');
        onClose();
      },
      onError: (err: any) => {
        if (err?.response?.status === 403 || err?.message?.includes('SMART_ALERT_LIMIT_EXCEEDED')) {
          Alert.alert(
            'Alert Limit Reached',
            'You have reached your smart alert quota limit. Upgrade your credit plan to create more alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade Plan', onPress: () => onQuotaExceeded && onQuotaExceeded() },
            ]
          );
        } else {
          Alert.alert('Creation Failed', err?.message || 'Unable to create smart alert. Please try again.');
        }
      },
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialAlert ? 'Edit Smart Alert' : 'Create Smart Alert'}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close smart alert dialog"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollForm}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Alert Label *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. iPhone 13 in Mumbai"
                value={formState.name}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Search Keyword</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. OLED TV, Royal Enfield"
                value={formState.keywords}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, keywords: text }))}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mobile Phones, Electronics"
                value={formState.category}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, category: text }))}
              />
            </View>

            <View style={styles.rowGroup}>
              <View style={[styles.fieldGroup, styles.halfField]}>
                <Text style={styles.label}>Min Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={formState.minPrice}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, minPrice: text }))}
                />
              </View>

              <View style={[styles.fieldGroup, styles.halfField]}>
                <Text style={styles.label}>Max Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={formState.maxPrice}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, maxPrice: text }))}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Location / City</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mumbai, New Delhi"
                value={formState.location}
                onChangeText={(text) => setFormState((prev) => ({ ...prev, location: text }))}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <AppButton
              label={createMutation.isPending ? 'Saving...' : 'Save Smart Alert'}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              style={styles.submitButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeText: { fontSize: 18, color: '#64748b', fontWeight: '600' },
  scrollForm: { marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  rowGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  halfField: { width: '48%' },
  modalFooter: { paddingTop: 8 },
  submitButton: { backgroundColor: '#2563eb' },
});
