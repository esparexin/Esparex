import React from 'react';
import { View, Image, ScrollView } from 'react-native';
import { AppText, Card, AppIcon, Badge } from '@esparex/mobile-ui';
import { usePostAdDraft } from '../../usePostAdDraft';

/**
 * StepPreview — Step 4 of the Post Ad wizard.
 *
 * Renders a read-only summary of everything the user has entered so far.
 * Acts as a final review before submission (Commit 23).
 *
 * Does NOT:
 * - Allow editing (tapping a field should navigate back — future enhancement)
 * - Call any API
 * - Mutate the draft
 */
export const StepPreview = () => {
  const { state } = usePostAdDraft();
  const { draft } = state;

  const primaryImage = draft.localImages?.[0];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h3" className="text-slate-800 dark:text-slate-100 mb-1">
        Review your listing
      </AppText>
      <AppText variant="body" className="text-slate-500 dark:text-slate-400 mb-5">
        Check everything looks right before submitting.
      </AppText>

      {/* Preview card — mirrors ListingCard appearance */}
      <Card className="overflow-hidden mb-4">
        {/* Primary image */}
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            className="w-full h-48 bg-slate-800"
            resizeMode="cover"
            accessible
            accessibilityLabel="Primary listing photo"
          />
        ) : (
          <View className="w-full h-48 bg-slate-800 items-center justify-center">
            <AppIcon name="Image" size={48} color="#475569" />
            <AppText variant="caption" className="text-slate-500 mt-2">
              No photo added
            </AppText>
          </View>
        )}

        <View className="p-4">
          {/* Title and price */}
          <View className="flex-row justify-between items-start mb-3">
            <AppText
              variant="h3"
              className="text-slate-100 flex-1 mr-4"
              numberOfLines={2}
            >
              {draft.title ?? '—'}
            </AppText>
            <AppText variant="h2" className="text-sky-400">
              {draft.price !== undefined ? `₹${draft.price.toLocaleString()}` : '—'}
            </AppText>
          </View>

          {/* Category and condition badges */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {draft.categoryName && (
              <Badge label={draft.categoryName} variant="brand" />
            )}
            {draft.condition && (
              <Badge label={draft.condition.replace('_', ' ')} variant="default" />
            )}
          </View>

          {/* Location */}
          {draft.locationDisplay && (
            <View className="flex-row items-center mb-3">
              <AppIcon name="MapPin" size={14} color="#64748b" />
              <AppText variant="caption" className="text-slate-400 ml-1">
                {draft.locationDisplay}
              </AppText>
            </View>
          )}

          {/* Description */}
          {draft.description && (
            <View className="border-t border-slate-800 pt-3">
              <AppText variant="caption" className="text-slate-300 leading-relaxed">
                {draft.description}
              </AppText>
            </View>
          )}
        </View>
      </Card>

      {/* Photo count summary */}
      <View className="flex-row items-center mb-4">
        <AppIcon name="Images" size={16} color="#64748b" />
        <AppText variant="caption" className="text-slate-400 ml-2">
          {draft.localImages?.length ?? 0} photo{(draft.localImages?.length ?? 0) !== 1 ? 's' : ''} added
        </AppText>
      </View>

      {/* Submission notice */}
      <View className="bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
        <View className="flex-row items-start">
          <AppIcon name="Info" size={16} color="#0ea5e9" />
          <AppText variant="caption" className="text-sky-700 dark:text-sky-300 ml-2 flex-1">
            By submitting, your listing will be reviewed and published within a few minutes.
            You can edit or remove it any time from your profile.
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
};
