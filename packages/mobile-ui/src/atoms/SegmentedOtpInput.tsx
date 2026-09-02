import React, { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { AppText } from './AppText';

export interface SegmentedOtpInputProps {
  length?: number;
  value: string;
  onChangeText: (otp: string) => void;
  error?: string;
  editable?: boolean;
  autoFocus?: boolean;
  containerClassName?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface SegmentedOtpInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

export const SegmentedOtpInput = forwardRef<SegmentedOtpInputRef, SegmentedOtpInputProps>(
  (
    {
      length = 6,
      value = '',
      onChangeText,
      error,
      editable = true,
      autoFocus = false,
      containerClassName = '',
      accessibilityLabel = '6-digit OTP Input',
      accessibilityHint = 'Enter the 6-digit verification code',
    },
    ref
  ) => {
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const [isFocused, setIsFocused] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        onChangeText('');
        inputRef.current?.clear();
      },
    }));

    const handlePress = () => {
      if (editable) {
        inputRef.current?.focus();
      }
    };

    const handleChangeText = (text: string) => {
      const sanitized = text.replace(/\D/g, '').slice(0, length);
      onChangeText(sanitized);
    };

    const digits = value.split('');
    const hasError = Boolean(error);

    return (
      <View className={`w-full ${containerClassName}`}>
        <Pressable
          onPress={handlePress}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityValue={{ text: value ? `Current code: ${value}` : 'Empty' }}
          className="w-full relative"
        >
          <View className="flex-row items-center justify-between gap-2">
            {Array.from({ length }).map((_, index) => {
              const digit = digits[index] || '';
              const isCurrent = isFocused && editable && index === digits.length;
              const isFilled = Boolean(digit);

              let borderClass = 'border-border bg-card';
              if (hasError) {
                borderClass = 'border-error dark:border-error bg-red-50/20 dark:bg-red-950/20';
              } else if (isCurrent) {
                borderClass = 'border-brand-600 dark:border-brand-400 bg-brand-50/20 dark:bg-brand-950/20';
              } else if (isFilled) {
                borderClass = 'border-foreground-secondary bg-card';
              }

              return (
                <View
                  key={index}
                  className={`flex-1 max-w-[52px] h-14 rounded-xl border-2 items-center justify-center ${borderClass}`}
                >
                  <AppText
                    variant="h2"
                    className="text-center font-bold text-foreground"
                  >
                    {digit}
                  </AppText>
                </View>
              );
            })}
          </View>

          {/* Hidden absolute input overlay for keyboard focus & SMS OTP autofill */}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChangeText}
            maxLength={length}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            editable={editable}
            autoFocus={autoFocus}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={styles.hiddenInput}
            caretHidden={true}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        </Pressable>

        {error && (
          <AppText
            variant="caption"
            color="error"
            className="mt-2 text-center"
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        )}
      </View>
    );
  }
);

SegmentedOtpInput.displayName = 'SegmentedOtpInput';

const styles = StyleSheet.create({
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
  },
});
