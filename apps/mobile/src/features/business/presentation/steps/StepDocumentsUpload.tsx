import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Container, Card, AppText } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { BusinessFormState } from '../../domain/BusinessFormState';
import { services } from '../../../../bootstrap';

interface StepDocumentsUploadProps {
  formState: BusinessFormState;
  onChange: (updates: Partial<BusinessFormState>) => void;
}

export function StepDocumentsUpload({ formState, onChange }: StepDocumentsUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async (docType: 'id_proof' | 'business_proof' | 'certificate') => {
    try {
      const result = await services.imagePicker.pick();
      if (!result.success) {
        if (result.reason === 'permission-denied') {
          Alert.alert('Permission Required', result.message || 'Media library access is required to attach verification documents.');
        } else if (result.reason === 'error') {
          Alert.alert('Selection Failed', result.message || 'Unable to select document. Please try again.');
        }
        return;
      }

      if (result.images && result.images[0]) {
        const asset = result.images[0];
        setUploading(true);
        const fileUrl = await services.businessService.uploadDocument(asset.uri, asset.mimeType || 'image/jpeg');

        const updatedDocs = formState.documents.filter((d) => d.type !== docType);
        updatedDocs.push({
          type: docType,
          url: fileUrl,
          idProofType: docType === 'id_proof' ? 'aadhaar' : undefined,
        });

        onChange({ documents: updatedDocs });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to upload document. Please try again.';
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  const isUploaded = (type: string) => formState.documents.some((d) => d.type === type);

  return (
    <Container className="p-4">
      <Card className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100 mb-1">
          Verification Documents
        </AppText>
        <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-4">
          Upload your ID proof and business verification documents
        </AppText>

        {uploading && (
          <View className="flex-row items-center bg-sky-50 dark:bg-sky-950 p-2.5 rounded-lg mb-3">
            <ActivityIndicator size="small" color={base.brand[500]} />
            <AppText variant="caption" className="ml-2 text-sky-700 dark:text-sky-300">
              Uploading document to secure storage...
            </AppText>
          </View>
        )}

        <View className="flex-row items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
          <View className="flex-1 mr-3">
            <AppText variant="body" className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Identity Proof (Aadhaar / PAN) *
            </AppText>
            <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mt-0.5">
              Government issued photo ID proof
            </AppText>
          </View>
          <TouchableOpacity
            className={`px-3.5 py-2 rounded-lg ${
              isUploaded('id_proof')
                ? 'bg-emerald-100 dark:bg-emerald-950'
                : 'bg-brand-600 dark:bg-brand-500'
            }`}
            onPress={() => handlePickDocument('id_proof')}
            disabled={uploading}
          >
            <AppText
              variant="caption"
              className={`font-semibold ${
                isUploaded('id_proof')
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-white'
              }`}
            >
              {isUploaded('id_proof') ? '✓ Attached' : 'Upload ID'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between py-3">
          <View className="flex-1 mr-3">
            <AppText variant="body" className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Business Proof (GST / Shop License)
            </AppText>
            <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mt-0.5">
              Shop establishment certificate or GST card
            </AppText>
          </View>
          <TouchableOpacity
            className={`px-3.5 py-2 rounded-lg ${
              isUploaded('business_proof')
                ? 'bg-emerald-100 dark:bg-emerald-950'
                : 'bg-brand-600 dark:bg-brand-500'
            }`}
            onPress={() => handlePickDocument('business_proof')}
            disabled={uploading}
          >
            <AppText
              variant="caption"
              className={`font-semibold ${
                isUploaded('business_proof')
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-white'
              }`}
            >
              {isUploaded('business_proof') ? '✓ Attached' : 'Upload Proof'}
            </AppText>
          </TouchableOpacity>
        </View>
      </Card>
    </Container>
  );
}

