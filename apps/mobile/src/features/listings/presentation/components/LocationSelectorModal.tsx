import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText, AppInput, AppIcon, AppModalSheet } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { LocationMeta } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { PopularMetrosChips } from './PopularMetrosChips';

interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationMeta | null) => void;
  selectedLocationId?: string;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  selectedLocationId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationMeta[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setErrorMessage(null);
    } else {
      setIsSearching(true);
      setErrorMessage(null);
    }
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    const handler = setTimeout(async () => {
      try {
        const results = await services.locationService.searchLocations(trimmed);
        setSearchResults(results);
      } catch {
        setErrorMessage('Failed to search locations. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleDetectLocation = useCallback(async () => {
    setIsDetecting(true);
    setErrorMessage(null);
    try {
      const location = await services.locationService.detectLocation();
      if (location) {
        onSelectLocation(location);
        onClose();
      } else {
        setErrorMessage('Could not detect location. Please search manually.');
      }
    } catch {
      setErrorMessage('Location detection unavailable. Please search manually.');
    } finally {
      setIsDetecting(false);
    }
  }, [onSelectLocation, onClose]);

  const handleSelectAllIndia = useCallback(() => {
    onSelectLocation(null);
    onClose();
  }, [onSelectLocation, onClose]);

  const handleSelectResult = useCallback((item: LocationMeta) => {
    onSelectLocation(item);
    onClose();
  }, [onSelectLocation, onClose]);

  return (
    <AppModalSheet visible={visible} onClose={onClose} title="Select Location">
      <View className="my-4">
            <AppInput placeholder="Search city, area or state…" value={searchQuery} onChangeText={handleSearchChange} autoCapitalize="none" autoCorrect={false} accessibilityLabel="Location search input" />
          </View>

          {errorMessage && (
            <View className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
              <AppText variant="caption" className="text-red-600 dark:text-red-400 font-medium">{errorMessage}</AppText>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              onPress={handleSelectAllIndia}
              className={`flex-row items-center p-3.5 rounded-xl mb-2 border ${!selectedLocationId ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700' : 'bg-muted border-border'}`}
              accessibilityRole="button"
              accessibilityLabel="Select All India"
            >
              <View className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 items-center justify-center mr-3">
                <AppIcon name="MapPin" size={18} color={base.brand[600]} />
              </View>
              <View className="flex-1">
                <AppText variant="body" className="font-semibold text-foreground">All India</AppText>
                <AppText variant="caption" className="text-foreground-secondary">Show listings from everywhere across India</AppText>
              </View>
              {!selectedLocationId && <AppIcon name="CheckCircle2" size={18} color={base.brand[600]} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDetectLocation}
              disabled={isDetecting}
              className="flex-row items-center p-3.5 rounded-xl mb-4 bg-muted border border-border"
              accessibilityRole="button"
              accessibilityLabel="Detect my location via network"
            >
              <View className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/50 items-center justify-center mr-3">
                {isDetecting ? <ActivityIndicator size="small" color={base.brand[600]} /> : <AppIcon name="Globe" size={18} color={base.brand[600]} />}
              </View>
              <View className="flex-1">
                <AppText variant="body" className="font-semibold text-foreground">Detect my location</AppText>
                <AppText variant="caption" className="text-foreground-secondary">Detects your approximate city via network IP</AppText>
              </View>
            </TouchableOpacity>

            {searchQuery.trim().length === 0 && (
              <PopularMetrosChips selectedLocationId={selectedLocationId} onSelect={handleSelectResult} />
            )}

            {isSearching && (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color={base.brand[500]} />
                <AppText variant="caption" className="text-foreground-subtle mt-2">Searching locations…</AppText>
              </View>
            )}

            {!isSearching && searchResults.length > 0 && (
              <View className="mb-4">
                <AppText variant="caption" className="text-foreground-subtle uppercase font-semibold tracking-wider mb-2 px-1">Search Results</AppText>
                {searchResults.map((item) => {
                  const itemId = item.locationId || (item as { _id?: string })._id || item.name;
                  const isSelected = selectedLocationId === itemId;
                  const label = item.display || [item.city || item.name, item.state].filter(Boolean).join(', ');

                  return (
                    <TouchableOpacity
                      key={itemId}
                      onPress={() => handleSelectResult(item)}
                      className={`flex-row items-center p-3 rounded-xl mb-1.5 border ${isSelected ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700' : 'bg-muted border-border'}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select location ${label}`}
                    >
                      <AppIcon name="MapPin" size={16} color={isSelected ? base.brand[600] : base.slate[400]} />
                      <AppText variant="body" className="font-medium text-foreground ml-2.5 flex-1">{label}</AppText>
                      {isSelected && <AppIcon name="CheckCircle2" size={16} color={base.brand[600]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <View className="py-6 items-center">
                <AppText variant="body" className="text-foreground-secondary text-center">
                  No matching locations found for &ldquo;{searchQuery}&rdquo;.
                </AppText>
              </View>
            )}
          </ScrollView>
    </AppModalSheet>
  );
};
