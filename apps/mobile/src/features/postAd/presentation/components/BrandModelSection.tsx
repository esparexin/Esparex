import React from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { AppText } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import type { CatalogBrand, CatalogModel } from '../hooks/useCategoryDependents';

interface BrandModelSectionProps {
  brands: CatalogBrand[];
  models: CatalogModel[];
  selectedBrandId?: string;
  selectedBrandName?: string;
  selectedModelId?: string;
  selectedModelName?: string;
  customBrandName?: string;
  customModelName?: string;
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  onSelectBrand: (payload: { brandId?: string; brandName?: string; customBrandName?: string }) => void;
  onSelectModel: (payload: { modelId?: string; modelName?: string; customModelName?: string }) => void;
}

export const BrandModelSection = ({
  brands,
  models,
  selectedBrandId,
  selectedBrandName,
  selectedModelId,
  selectedModelName,
  customBrandName,
  customModelName,
  isLoadingBrands,
  isLoadingModels,
  onSelectBrand,
  onSelectModel,
}: BrandModelSectionProps) => {
  return (
    <View className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
      <AppText variant="body" className="font-bold text-slate-900 dark:text-white">
        Brand & Model
      </AppText>

      {/* Brand Selector */}
      {isLoadingBrands ? (
        <ActivityIndicator size="small" color={base.brand[600]} />
      ) : brands.length > 0 ? (
        <View>
          <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-2">
            Select Brand
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-1">
            {brands.map((b) => {
              const isSelected = selectedBrandId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => onSelectBrand({ brandId: b.id, brandName: b.name })}
                  className={`px-3 py-1.5 rounded-full mr-2 border ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <AppText
                    variant="caption"
                    className={
                      isSelected
                        ? 'text-brand-600 dark:text-brand-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }
                  >
                    {b.name}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View>
          <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-1">
            Brand Name (Optional)
          </AppText>
          <TextInput
            value={selectedBrandName || customBrandName || ''}
            onChangeText={(text) => onSelectBrand({ customBrandName: text, brandName: text })}
            placeholder="e.g. Apple, Dell, Samsung"
            placeholderTextColor="#94a3b8"
            className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
          />
        </View>
      )}

      {/* Model Selector */}
      {selectedBrandId && (
        <View className="mt-3">
          <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-2">
            Select Model (Optional)
          </AppText>
          {isLoadingModels ? (
            <ActivityIndicator size="small" color={base.brand[600]} />
          ) : models.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-1">
              {models.map((m) => {
                const isSelected = selectedModelId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => onSelectModel({ modelId: m.id, modelName: m.name })}
                    className={`px-3 py-1.5 rounded-full mr-2 border ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <AppText
                      variant="caption"
                      className={
                        isSelected
                          ? 'text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }
                    >
                      {m.name}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <TextInput
              value={selectedModelName || customModelName || ''}
              onChangeText={(text) => onSelectModel({ customModelName: text, modelName: text })}
              placeholder="e.g. Inspiron 15, MacBook Pro M2"
              placeholderTextColor="#94a3b8"
              className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm"
            />
          )}
        </View>
      )}
    </View>
  );
};
