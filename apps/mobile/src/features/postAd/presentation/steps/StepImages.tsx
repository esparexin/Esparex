import React, { useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { AppText, Center, AppIcon } from '@esparex/mobile-ui';
import { usePostAdDraft } from '../../usePostAdDraft';
import { ImageGrid, AddPhotoButton } from '../components/ImagePickerComponents';
import { pickedImageUris } from '../../application/IImagePicker';
import { services } from '../../../../bootstrap';

const MAX_IMAGES = 8;

/**
 * StepImages — Step 3 of the Post Ad wizard.
 *
 * Responsibilities:
 * - Read current localImages from draft
 * - Invoke the image picker abstraction and append results
 * - Allow removing individual images
 * - Dispatch setImages() when the list changes
 *
 * Does NOT:
 * - Know about step navigation or validation thresholds
 * - Contain upload logic (that is Commit 23)
 * - Store images in any state other than the wizard draft
 */
export const StepImages = () => {
  const { state, setImages } = usePostAdDraft();
  const images = state.draft.localImages ?? [];
  const canAddMore = images.length < MAX_IMAGES;

  const handleAdd = useCallback(async () => {
    if (!canAddMore) return;
    const result = await services.imagePicker.pick();
    if (result.success) {
      const uris = pickedImageUris(result.images);
      if (uris.length > 0) {
        const available = MAX_IMAGES - images.length;
        setImages([...images, ...uris.slice(0, available)]);
      }
    } else if (result.reason === 'permission-denied') {
      Alert.alert(
        'Permission Required',
        'Photo gallery access is required to add photos to your listing.',
      );
    } else if (result.reason === 'error') {
      Alert.alert('Image Selection Failed', result.message || 'Could not select photo.');
    }
  }, [images, canAddMore, setImages]);

  const handleRemove = useCallback((index: number) => {
    Alert.alert('Remove photo', 'Remove this photo from your listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updated = images.filter((_, i) => i !== index);
          setImages(updated);
        },
      },
    ]);
  }, [images, setImages]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" className="text-slate-800 dark:text-slate-100 mb-1">
        Add photos
      </AppText>
      <AppText variant="body" className="text-slate-500 dark:text-slate-400 mb-5">
        Listings with photos get significantly more views. Add up to {MAX_IMAGES}.
      </AppText>

      {/* Thumbnail grid + add button */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <ImageGrid images={images} onRemove={handleRemove} />
        {canAddMore && <AddPhotoButton onPress={handleAdd} />}
      </View>

      {/* Guidance when no images added yet */}
      {images.length === 0 && (
        <Center className="py-8">
          <AppIcon name="ImagePlus" size={48} color="#334155" />
          <AppText variant="body" className="text-slate-400 dark:text-slate-500 mt-3 text-center px-8">
            Tap the button above to add your first photo.
          </AppText>
        </Center>
      )}

      {/* Count indicator */}
      {images.length > 0 && (
        <AppText variant="caption" className="text-slate-400 dark:text-slate-500 text-center">
          {images.length} of {MAX_IMAGES} photos added
        </AppText>
      )}
    </ScrollView>
  );
};
