import React, { useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Screen, Container, Card, AppText } from '@esparex/mobile-ui';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ProfileStackParamList, ROUTES } from '../../../../navigation/routes';
import { useListingDetails } from '../hooks/useListingDetails';
import { useUpdateListing } from '../hooks/useUpdateListing';
import { Listing } from '../../domain/Listing';

type EditListingRouteProp = RouteProp<ProfileStackParamList, typeof ROUTES.EDIT_LISTING>;

interface EditListingFormProps {
  id: string;
  listing: Listing;
}

function EditListingForm({ id, listing }: EditListingFormProps) {
  const navigation = useNavigation();
  const updateMutation = useUpdateListing();

  const [title, setTitle] = useState(listing.title || '');
  const [price, setPrice] = useState(listing.price ? String(listing.price) : '');
  const [description, setDescription] = useState(listing.description || '');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      Alert.alert('Validation Error', 'Please enter a valid non-negative price.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        updates: {
          title: title.trim(),
          price: numericPrice,
          description: description.trim(),
        },
      });
      Alert.alert('Success', 'Listing updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to update listing. Please try again.';
      Alert.alert('Update Failed', errorMessage);
    }
  };

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Container className="mb-4">
          <AppText variant="h2" className="text-slate-900 dark:text-white font-bold mb-1">
            Edit Listing
          </AppText>
          <AppText variant="body" className="text-slate-500 dark:text-slate-400">
            Update your ad title, price, or description.
          </AppText>
        </Container>

        <Card className="p-4 mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <AppText variant="label" className="text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Ad Title *
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. iPhone 13 Pro 128GB"
            placeholderTextColor="#94a3b8"
            className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white mb-4"
          />

          <AppText variant="label" className="text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Price (₹) *
          </AppText>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 45000"
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
            className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white mb-4"
          />

          <AppText variant="label" className="text-slate-700 dark:text-slate-300 mb-1 font-semibold">
            Description
          </AppText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe condition, specs, reason for selling..."
            multiline
            numberOfLines={4}
            placeholderTextColor="#94a3b8"
            className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white mb-2 min-h-[100px] text-top"
          />
        </Card>

        <TouchableOpacity
          onPress={handleSave}
          disabled={updateMutation.isPending}
          className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 p-4 rounded-xl items-center justify-center mb-8"
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <AppText variant="body" className="text-white font-bold text-base">
              Save Changes
            </AppText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

export function EditListingScreen() {
  const route = useRoute<EditListingRouteProp>();
  const { id } = route.params;
  const { data: listing, isLoading: isFetching } = useListingDetails(id);

  if (isFetching || !listing) {
    return (
      <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Container className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </Container>
      </Screen>
    );
  }

  return <EditListingForm key={listing.id} id={id} listing={listing} />;
}
