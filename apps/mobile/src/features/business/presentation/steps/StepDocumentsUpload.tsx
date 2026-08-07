import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Container, Card } from '@esparex/mobile-ui';
import * as ImagePicker from 'expo-image-picker';
import { BusinessFormState } from '../../domain/BusinessFormState';
import { ApiBusinessRepository } from '../../application/ApiBusinessRepository';
import { semantic } from '@esparex/design-tokens';

interface StepDocumentsUploadProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

const apiRepository = new ApiBusinessRepository();

export function StepDocumentsUpload({ formState, onChange }: StepDocumentsUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async (docType: 'id_proof' | 'business_proof' | 'certificate') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Media library access is required to attach verification documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploading(true);
        const fileUrl = await apiRepository.uploadDocument(asset.uri, asset.mimeType || 'image/jpeg');

        const updatedDocs = formState.documents.filter((d) => d.type !== docType);
        updatedDocs.push({
          type: docType,
          url: fileUrl,
          idProofType: docType === 'id_proof' ? 'aadhaar' : undefined,
        });

        onChange({ documents: updatedDocs });
      }
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Unable to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isUploaded = (type: string) => formState.documents.some((d) => d.type === type);

  return (
    <Container style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Verification Documents</Text>
        <Text style={styles.subtitle}>Upload your ID proof and business verification documents</Text>

        {uploading && (
          <View style={styles.loadingBanner}>
            {/* eslint-disable-next-line react-native/no-color-literals */}
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Uploading document to secure storage...</Text>
          </View>
        )}

        <View style={styles.docItem}>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Identity Proof (Aadhaar / PAN) *</Text>
            <Text style={styles.docDesc}>Government issued photo ID proof</Text>
          </View>
          <TouchableOpacity
            style={[styles.uploadButton, isUploaded('id_proof') && styles.uploadedButton]}
            onPress={() => handlePickDocument('id_proof')}
            disabled={uploading}
          >
            <Text style={[styles.buttonText, isUploaded('id_proof') && styles.uploadedText]}>
              {isUploaded('id_proof') ? '✓ Attached' : 'Upload ID'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.docItem}>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Business Proof (GST / Shop License)</Text>
            <Text style={styles.docDesc}>Shop establishment certificate or GST card</Text>
          </View>
          <TouchableOpacity
            style={[styles.uploadButton, isUploaded('business_proof') && styles.uploadedButton]}
            onPress={() => handlePickDocument('business_proof')}
            disabled={uploading}
          >
            <Text style={[styles.buttonText, isUploaded('business_proof') && styles.uploadedText]}>
              {isUploaded('business_proof') ? '✓ Attached' : 'Upload Proof'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 16, borderRadius: 16, backgroundColor: semantic.light.card }, // formerly #ffffff
  title: { fontSize: 18, fontWeight: '700', color: semantic.light.foreground, marginBottom: 4 }, // formerly #0f172a
  subtitle: { fontSize: 13, color: semantic.light['muted-foreground'], marginBottom: 16 }, // formerly #64748b
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: semantic.light['info-subtle'],
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: { marginLeft: 8, fontSize: 12, color: semantic.light['info-dark'] },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: semantic.light.border, // formerly #f1f5f9
  },
  docInfo: { flex: 1, marginRight: 12 },
  docTitle: { fontSize: 14, fontWeight: '600', color: semantic.light.foreground }, // formerly #1e293b
  docDesc: { fontSize: 12, color: semantic.light['muted-foreground'], marginTop: 2 }, // formerly #64748b
  uploadButton: {
    backgroundColor: semantic.light.action,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadedButton: { backgroundColor: semantic.light['success-subtle'] },
  buttonText: { fontSize: 13, fontWeight: '600', color: semantic.light['primary-foreground'] }, // formerly #ffffff
  uploadedText: { color: semantic.light['success-dark'] },
});
