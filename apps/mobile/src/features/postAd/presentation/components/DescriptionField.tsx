import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
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
        <AppText variant="caption" className="font-semibold text-foreground">
          Description <AppText className="text-destructive">*</AppText>
        </AppText>

        {onAiGenerate && (
          <TouchableOpacity
            onPress={onAiGenerate}
            disabled={isGeneratingAi}
            className="flex-row items-center px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
            accessibilityRole="button"
            accessibilityLabel="Auto-fill description with AI"
          >
            {isGeneratingAi ? (
              <ActivityIndicator size="small" color={base.brand[500]} />
            ) : (
              <>
                <AppIcon name="Sparkles" size={12} color={base.brand[500]} />
                <AppText variant="caption" className="ml-1 text-primary font-semibold">
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
        placeholderTextColor={base.slate[500]}
        multiline
        numberOfLines={4}
        maxLength={MAX_AD_DESCRIPTION_CHARS}
        autoCapitalize="sentences"
        autoCorrect
        className="p-3 bg-card border border-border rounded-xl text-foreground text-body-lg min-h-[96px] text-top"
        accessibilityLabel="Listing description"
      />

      <View className="flex-row justify-end mt-1">
        <AppText
          variant="caption"
          className={
            currentLength > MAX_AD_DESCRIPTION_CHARS ? 'text-destructive font-bold' : 'text-foreground-secondary'
          }
        >
          {currentLength} / {MAX_AD_DESCRIPTION_CHARS} characters
        </AppText>
      </View>
    </View>
  );
};
