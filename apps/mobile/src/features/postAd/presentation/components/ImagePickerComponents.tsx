import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface ImageGridProps {
  images: string[];
  onRemove: (index: number) => void;
}

/**
 * ImageGrid — stateless grid of selected image thumbnails.
 *
 * Each thumbnail shows the image and a remove button.
 * Receives only what it needs — no knowledge of the wizard or draft.
 */
export const ImageGrid = ({ images, onRemove }: ImageGridProps) => {
  if (images.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-2 mb-4">
      {images.map((uri, index) => (
        <View key={`${uri}-${index}`} className="w-24 h-24 rounded-xl overflow-hidden">
          <Image
            source={{ uri }}
            className="w-full h-full"
            resizeMode="cover"
            accessible
            accessibilityLabel={`Selected photo ${index + 1}`}
          />
          <TouchableOpacity
            onPress={() => onRemove(index)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 items-center justify-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Remove photo ${index + 1}`}
          >
            <AppIcon name="X" size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

interface AddPhotoButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * AddPhotoButton — stateless button that triggers the image picker.
 */
export const AddPhotoButton = ({ onPress, disabled = false }: AddPhotoButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    accessible
    accessibilityRole="button"
    accessibilityLabel="Add photo"
    accessibilityHint="Opens the image picker to select a photo"
    accessibilityState={{ disabled }}
    className={[
      'w-24 h-24 rounded-xl border-2 border-dashed items-center justify-center',
      disabled
        ? 'border-slate-200 dark:border-slate-700 opacity-50'
        : 'border-brand-400 dark:border-brand-600',
    ].join(' ')}
  >
    <AppIcon name="Plus" size={28} color={disabled ? base.slate[400] : base.brand[500]} />
    <AppText variant="caption" className="text-brand-600 dark:text-brand-400 mt-1">
      Add
    </AppText>
  </TouchableOpacity>
);
