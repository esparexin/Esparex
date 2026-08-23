import React, { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { AppText } from '@esparex/mobile-ui';
import { LocationMeta } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { usePostAdDraft } from '../../usePostAdDraft';
import { usePostAdAiGeneration } from '../hooks/usePostAdAiGeneration';
import { TitleField } from '../components/TitleField';
import { PriceField } from '../components/PriceField';
import { LocationField } from '../components/LocationField';
import { DescriptionField } from '../components/DescriptionField';
import { LocationSelectorModal } from '../../../listings/presentation/components/LocationSelectorModal';

/**
 * StepDetails — Step 2 of the Post Ad wizard (Listing Details & Pricing).
 *
 * Responsibilities:
 * - Title input (10–80 chars) with ✨ AI Auto-fill
 * - Description input (20–500 chars) with ✨ AI Auto-fill
 * - Side-by-side Price input and Mark as Free toggle
 * - Location selector with 🎯 Auto-Detect GPS/network button
 */
export const StepDetails = () => {
  const {
    state,
    setTitle,
    setDescription,
    setPrice,
    setIsFree,
    setLocation,
  } = usePostAdDraft();

  const { draft } = state;
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { generateContent, isGenerating: isGeneratingAi } = usePostAdAiGeneration();

  // AI Title Generation
  const handleGenerateTitle = useCallback(async () => {
    const generated = await generateContent('title', {
      category: draft.categoryName,
      brand: draft.brandName || draft.customBrandName,
      model: draft.modelName || draft.customModelName,
      condition: draft.deviceCondition,
      workingParts: draft.spareParts,
    });
    if (generated) {
      setTitle(generated);
    }
  }, [draft, generateContent, setTitle]);

  // AI Description Generation
  const handleGenerateDescription = useCallback(async () => {
    const generated = await generateContent('description', {
      category: draft.categoryName,
      brand: draft.brandName || draft.customBrandName,
      model: draft.modelName || draft.customModelName,
      condition: draft.deviceCondition,
      workingParts: draft.spareParts,
    });
    if (generated) {
      setDescription(generated);
    }
  }, [draft, generateContent, setDescription]);

  // Auto-Detect Location
  const handleAutoDetectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await services.locationService.detectLocation();
      if (loc) {
        setLocation(loc);
      } else {
        Alert.alert('Location Detection', 'Could not detect location automatically. Please select manually.');
      }
    } catch {
      Alert.alert('Location Detection', 'Location detection service unavailable. Please select manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, [setLocation]);

  const handleSelectLocation = useCallback(
    (loc: LocationMeta | null) => {
      setLocation(loc);
    },
    [setLocation]
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="h3" className="text-slate-900 dark:text-white font-bold mb-1">
        Listing Details
      </AppText>
      <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-5">
        Provide pricing, title, description, and location for your ad.
      </AppText>

      <View>
        {/* Title with AI Auto-fill */}
        <TitleField
          value={draft.title}
          onChange={setTitle}
          onAiGenerate={handleGenerateTitle}
          isGeneratingAi={isGeneratingAi === 'title'}
        />

        {/* Description with AI Auto-fill */}
        <DescriptionField
          value={draft.description}
          onChange={setDescription}
          onAiGenerate={handleGenerateDescription}
          isGeneratingAi={isGeneratingAi === 'description'}
        />

        {/* Side-by-Side Price & Free Toggle */}
        <PriceField
          value={draft.price}
          isFree={draft.isFree}
          onChange={setPrice}
          onToggleFree={setIsFree}
        />

        {/* Location with Auto-Detect */}
        <LocationField
          location={draft.location}
          locationDisplay={draft.locationDisplay}
          onPressSelect={() => setShowLocationModal(true)}
          onAutoDetect={handleAutoDetectLocation}
          isDetecting={isDetectingLocation}
        />
      </View>

      <LocationSelectorModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleSelectLocation}
        selectedLocationId={draft.location?.locationId || draft.locationId}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 40 },
});
