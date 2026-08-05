import React, { useState, useCallback } from 'react';
import { View, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { Center, AppIcon, AppText } from '@esparex/mobile-ui';

const { width } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
}

export const ImageCarousel = ({ images }: ImageCarouselProps) => {
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
            style={{ width, height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        )}
      />
      {images.length > 1 && (
        <View className="absolute bottom-3 right-4 bg-black/60 px-2.5 py-1 rounded-full">
          <AppText variant="caption" className="text-white text-xs font-semibold">
            {activeIndex + 1} / {images.length}
          </AppText>
        </View>
      )}
    </View>
  );
};
