import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { AppText, Center, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { MAX_AD_IMAGES } from '@esparex/contracts';
import { usePostAdDraft } from '../../usePostAdDraft';
import { ImageGrid, AddPhotoButton } from '../components/ImagePickerComponents';
import { services } from '../../../../bootstrap';

/**
 * StepImages — Step 3 of the Post Ad wizard (Photos & Final Step).
 *
 * Responsibilities:
 * - Read current localImages/pickedImages from draft
 * - Pick photos up to MAX_AD_IMAGES (5 photos)
 * - Show Cover badge on the primary photo
 * - Remove individual images
 */
export const StepImages = () => {
  const { state, setPickedImages, setImages } = usePostAdDraft();
  const images = useMemo(() => state.draft.localImages ?? [], [state.draft.localImages]);
  const pickedImages = useMemo(() => state.draft.pickedImages ?? [], [state.draft.pickedImages]);
  const canAddMore = images.length < MAX_AD_IMAGES;

  const processImageResult = useCallback(
    (result: Awaited<ReturnType<typeof services.imagePicker.pick>>) => {
      if (result.success) {
        const available = MAX_AD_IMAGES - images.length;
        const newPicked = result.images.slice(0, available);
        const combinedPicked = [...pickedImages, ...newPicked];
        setPickedImages(combinedPicked);
        setImages(combinedPicked.map((img) => img.uri));
      } else if (result.reason === 'permission-denied') {
        Alert.alert(
          'Permission Required',
          result.message || 'Camera or photo gallery access is required to add photos.'
        );
      } else if (result.reason === 'error') {
        Alert.alert('Image Selection Failed', result.message || 'Could not process photo.');
      }
    },
    [images.length, pickedImages, setPickedImages, setImages]
  );

  const handlePickFromGallery = useCallback(async () => {
    const result = await services.imagePicker.pick();
    processImageResult(result);
  }, [processImageResult]);

  const handleCaptureFromCamera = useCallback(async () => {
    const result = await services.imagePicker.captureFromCamera();
    processImageResult(result);
  }, [processImageResult]);

  const handleAdd = useCallback(() => {
    if (!canAddMore) return;
    Alert.alert('Add Photo', 'Choose how you want to add photos to your listing', [
      { text: 'Take Photo', onPress: () => void handleCaptureFromCamera() },
      { text: 'Choose from Gallery', onPress: () => void handlePickFromGallery() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [canAddMore, handleCaptureFromCamera, handlePickFromGallery]);

  const handleRemove = useCallback(
    (index: number) => {
      Alert.alert('Remove photo', 'Remove this photo from your listing?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPicked = pickedImages.filter((_, i) => i !== index);
            setPickedImages(updatedPicked);
            setImages(updatedPicked.map((img) => img.uri));
          },
        },
      ]);
    },
    [pickedImages, setPickedImages, setImages]
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" className="text-foreground font-bold mb-1">
        Add Photos
      </AppText>
      <AppText variant="caption" className="text-foreground-secondary mb-5">
        Listings with clear photos get up to 5x more responses. Add up to {MAX_AD_IMAGES} photos.
      </AppText>

      {/* Thumbnail grid + add button */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        <ImageGrid images={[...images]} onRemove={handleRemove} />
        {canAddMore && <AddPhotoButton onPress={handleAdd} />}
      </View>

      {/* Guidance when no images added yet */}
      {images.length === 0 && (
        <Center className="py-8 bg-muted rounded-2xl border border-dashed border-border my-4">
          <AppIcon name="ImagePlus" size={40} color={base.slate[500]} />
          <AppText variant="body" className="text-foreground font-semibold mt-3 text-center">
            Upload at least 1 photo
          </AppText>
          <AppText variant="caption" className="text-foreground-secondary text-center mt-1 px-6">
            The first photo will be shown as the primary cover photo for your ad.
          </AppText>
        </Center>
      )}

      {/* Count indicator */}
      {images.length > 0 && (
        <AppText variant="caption" className="text-foreground-secondary text-center font-medium mt-2">
          {images.length} of {MAX_AD_IMAGES} photos added (First image is Cover)
        </AppText>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 40 },
});
