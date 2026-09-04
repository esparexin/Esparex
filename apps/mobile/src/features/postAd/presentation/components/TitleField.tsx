import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AppInput, AppText, AppIcon } from '@esparex/mobile-ui';
import { MAX_AD_TITLE_CHARS } from '@esparex/contracts';
import { base } from '@esparex/design-tokens';

interface TitleFieldProps {
  value: string | undefined;
  onChange: (text: string) => void;
  onAiGenerate?: () => void;
  isGeneratingAi?: boolean;
}

export const TitleField = ({
  value,
  onChange,
  onAiGenerate,
  isGeneratingAi = false,
}: TitleFieldProps) => {
  const currentLength = value?.length || 0;

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1.5">
        <AppText variant="caption" className="font-semibold text-slate-900 dark:text-slate-100">
          Title <AppText className="text-red-500">*</AppText>
        </AppText>

        {onAiGenerate && (
          <TouchableOpacity
            onPress={onAiGenerate}
            disabled={isGeneratingAi}
            className="flex-row items-center px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800"
            accessibilityRole="button"
            accessibilityLabel="Auto-fill title with AI"
          >
            {isGeneratingAi ? (
              <ActivityIndicator size="small" color={base.brand[500]} />
            ) : (
              <>
                <AppIcon name="Sparkles" size={12} color={base.brand[500]} />
                <AppText variant="caption" className="ml-1 text-sky-700 dark:text-sky-300 font-semibold text-xs">
                  Auto-fill (AI)
                </AppText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <AppInput
        value={value ?? ''}
        onChangeText={onChange}
        placeholder="e.g. Apple MacBook Pro M2 16-inch 512GB"
        returnKeyType="next"
        autoCapitalize="sentences"
        autoCorrect
        maxLength={MAX_AD_TITLE_CHARS}
        leftIcon={<AppIcon name="Tag" size={16} color={base.slate[400]} />}
        accessibilityLabel="Listing title"
      />

      <View className="flex-row justify-end mt-1">
        <AppText
          variant="caption"
          className={`text-xs ${
            currentLength > MAX_AD_TITLE_CHARS ? 'text-red-500 font-bold' : 'text-slate-400'
          }`}
        >
          {currentLength} / {MAX_AD_TITLE_CHARS} characters
        </AppText>
      </View>
    </View>
  );
};
