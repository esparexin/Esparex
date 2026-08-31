import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText, AppInput, AppIcon } from '@esparex/mobile-ui';
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

  // Debounced location search querying locationService
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

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

  // IP-based network location detection
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

  const handleSelectResult = useCallback(
    (item: LocationMeta) => {
      onSelectLocation(item);
      onClose();
    },
    [onSelectLocation, onClose]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[85%] border-t border-slate-200 dark:border-slate-800">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
              Select Location
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close location selector"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="X" size={20} color={base.slate[400]} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="my-4">
            <AppInput
              placeholder="Search city, area or state…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Location search input"
            />
          </View>

          {errorMessage && (
            <View className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
              <AppText variant="caption" className="text-red-600 dark:text-red-400 font-medium">
                {errorMessage}
              </AppText>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Action 1: All India (Default) */}
            <TouchableOpacity
              onPress={handleSelectAllIndia}
              className={`flex-row items-center p-3.5 rounded-xl mb-2 border ${
                !selectedLocationId
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700'
                  : 'bg-muted border-border'
              }`}
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

            {/* Action 2: Detect My Location (Network/IP) */}
            <TouchableOpacity
              onPress={handleDetectLocation}
              disabled={isDetecting}
              className="flex-row items-center p-3.5 rounded-xl mb-4 bg-muted border border-border"
              accessibilityRole="button"
              accessibilityLabel="Detect my location via network"
            >
              <View className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/50 items-center justify-center mr-3">
                {isDetecting ? (
                  <ActivityIndicator size="small" color={base.brand[600]} />
                ) : (
                  <AppIcon name="Globe" size={18} color={base.brand[600]} />
                )}
              </View>
              <View className="flex-1">
                <AppText variant="body" className="font-semibold text-foreground">Detect my location</AppText>
                <AppText variant="caption" className="text-foreground-secondary">Detects your approximate city via network IP</AppText>
              </View>
            </TouchableOpacity>

            {/* Popular Metro Cities (Default state when search is empty) */}
            {searchQuery.trim().length === 0 && (
              <PopularMetrosChips
                selectedLocationId={selectedLocationId}
                onSelect={handleSelectResult}
              />
            )}

            {/* Search Results List */}
            {isSearching && (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color={base.brand[500]} />
                <AppText variant="caption" className="text-slate-400 mt-2">
                  Searching locations…
                </AppText>
              </View>
            )}

            {!isSearching && searchResults.length > 0 && (
              <View className="mb-4">
                <AppText
                  variant="caption"
                  className="text-slate-400 uppercase font-semibold tracking-wider mb-2 px-1"
                >
                  Search Results
                </AppText>
                {searchResults.map((item) => {
                  const itemId = item.locationId || (item as { _id?: string })._id || item.name;
                  const isSelected = selectedLocationId === itemId;
                  const label = item.display || [item.city || item.name, item.state].filter(Boolean).join(', ');

                  return (
                    <TouchableOpacity
                      key={itemId}
                      onPress={() => handleSelectResult(item)}
                      className={`flex-row items-center p-3 rounded-xl mb-1.5 border ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                      }`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${label}`}
                    >
                      <AppIcon name="MapPin" size={16} color={base.slate[400]} />
                      <AppText
                        variant="body"
                        className="font-medium text-slate-800 dark:text-slate-200 ml-2.5 flex-1"
                      >
                        {label}
                      </AppText>
                      {isSelected && (
                        <AppIcon name="CheckCircle2" size={16} color={base.brand[600]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <View className="py-6 items-center">
                <AppText variant="body" className="text-slate-500 text-center">
                  No matching locations found for "{searchQuery}".
                </AppText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
