import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { AppInput, AppIcon } from '@esparex/mobile-ui';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder?: string;
}

export const SearchBar = React.memo<SearchBarProps>(({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search listings…',
}) => {
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <View className="flex-1">
        <AppInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<AppIcon name="Search" size={18} color="#64748b" />}
          rightIcon={
            value.length > 0 ? (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessible
                accessibilityLabel="Clear search"
                accessibilityRole="button"
              >
                <AppIcon name="X" size={16} color="#64748b" />
              </TouchableOpacity>
            ) : undefined
          }
          accessibilityLabel="Search listings"
          accessibilityHint="Type to search and press return to submit"
        />
      </View>
    </View>
  );
});

SearchBar.displayName = 'SearchBar';
