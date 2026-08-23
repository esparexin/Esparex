import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { MAX_AD_DESCRIPTION_CHARS } from '@esparex/contracts';

interface DescriptionFieldProps {
  value: string | undefined;
  onChange: (text: string) => void;
  onAiGenerate?: () => void;
  isGeneratingAi?: boolean;
}

export const DescriptionField = ({
  value,
  onChange,
  onAiGenerate,
  isGeneratingAi = false,
}: DescriptionFieldProps) => {
  const currentLength = value?.length || 0;

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1.5">
        <AppText variant="caption" className="font-semibold text-slate-900 dark:text-slate-100">
          Description <AppText className="text-red-500">*</AppText>
        </AppText>

        {onAiGenerate && (
          <TouchableOpacity
            onPress={onAiGenerate}
            disabled={isGeneratingAi}
            className="flex-row items-center px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800"
            accessibilityRole="button"
            accessibilityLabel="Auto-fill description with AI"
          >
            {isGeneratingAi ? (
              <ActivityIndicator size="small" color="#0284c7" />
            ) : (
              <>
                <AppIcon name="Sparkles" size={12} color="#0284c7" />
                <AppText variant="caption" className="ml-1 text-sky-700 dark:text-sky-300 font-semibold text-xs">
                  Auto-fill (AI)
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        value={value ?? ''}
        onChangeText={onChange}
        placeholder="Describe the item — condition, features, accessories included, or reason for selling…"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={4}
        maxLength={MAX_AD_DESCRIPTION_CHARS}
        autoCapitalize="sentences"
        autoCorrect
        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm min-h-[96px] text-top"
        accessibilityLabel="Listing description"
      />

      <View className="flex-row justify-end mt-1">
        <AppText
          variant="caption"
          className={`text-xs ${
            currentLength > MAX_AD_DESCRIPTION_CHARS ? 'text-red-500 font-bold' : 'text-slate-400'
          }`}
        >
          {currentLength} / {MAX_AD_DESCRIPTION_CHARS} characters
        </AppText>
      </View>
    </View>
  );
};
