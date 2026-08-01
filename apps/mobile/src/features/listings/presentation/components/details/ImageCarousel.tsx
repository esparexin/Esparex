import React from 'react';
import { View, Image, FlatList, Dimensions } from 'react-native';
import { Center, AppIcon } from '@esparex/mobile-ui';

const { width } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
}

export const ImageCarousel = ({ images }: ImageCarouselProps) => {
  if (!images || images.length === 0) {
    return (
      <Center className="w-full h-72 bg-slate-100 dark:bg-slate-800">
        <AppIcon name="Image" size={48} color="#94a3b8" />
      </Center>
    );
  }

  return (
    <View className="w-full h-72 bg-slate-100 dark:bg-slate-900">
      <FlatList
        data={images}
        keyExtractor={(item, index) => `${item}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height: '100%' }}
            resizeMode="cover"
          />
        )}
      />
    </View>
  );
};
