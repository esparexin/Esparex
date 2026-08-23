import React, { useState, useCallback } from 'react';
import { View, FlatList, Dimensions, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { Center, AppIcon, AppText } from '@esparex/mobile-ui';

const { width } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
  isSaved?: boolean;
  onToggleSave?: () => void;
  onShare?: () => void;
}

export const ImageCarousel = ({
  images,
  isSaved = false,
  onToggleSave,
  onShare,
}: ImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  }, [activeIndex]);

  if (!images || images.length === 0) {
    return (
      <Center className="w-full h-72 bg-slate-100 dark:bg-slate-800">
        <AppIcon name="Image" size={48} color="#94a3b8" />
      </Center>
    );
  }

  return (
    <View className="w-full h-72 bg-slate-100 dark:bg-slate-900 relative">
      <FlatList
        data={images}
        keyExtractor={(item, index) => `${item}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: '100%' }} // Exception: width is a runtime prop (dynamic measurement)
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        )}
      />

      {/* Action Buttons: Share & Favorite */}
      <View className="absolute top-3 right-3 flex-row items-center gap-2 z-10">
        {onShare && (
          <TouchableOpacity
            onPress={onShare}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Share listing"
          >
            <AppIcon name="Share2" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
        {onToggleSave && (
          <TouchableOpacity
            onPress={onToggleSave}
            activeOpacity={0.7}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save listing'}
          >
            <AppIcon
              name="Heart"
              size={18}
              color={isSaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${
                i === activeIndex
                  ? 'w-4 h-1.5 bg-white shadow-sm'
                  : 'w-1.5 h-1.5 bg-white/50'
              }`}
            />
          ))}
        </View>
      )}

      {/* Numerical Counter Pill */}
      {images.length > 1 && (
        <View className="absolute bottom-3 right-3 bg-black/60 px-2 py-0.5 rounded-full">
          <AppText variant="caption" className="text-white text-[11px] font-semibold">
            {activeIndex + 1}/{images.length}
          </AppText>
        </View>
      )}
    </View>
  );
};
