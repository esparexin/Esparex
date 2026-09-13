import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Alert, View, ActivityIndicator } from 'react-native';
import { Screen, Container, Card, AppText, AppIcon, AppButton, AppInput } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
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
  const [price, setPrice] = useState(
    listing.price?.amount !== undefined ? String(listing.price.amount) : ''
  );
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
    <Screen className="flex-1 bg-muted">
      <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">
        <Container className="mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back"
              accessibilityRole="button"
              className="mr-3 p-1 min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
            </TouchableOpacity>
            <View className="flex-1">
              <AppText variant="h2" className="text-foreground font-bold mb-1">
                Edit Listing
              </AppText>
              <AppText variant="body" className="text-foreground-subtle">
                Update your ad title, price, or description.
              </AppText>
            </View>
          </View>
        </Container>

        <Card className="p-4 mb-4 bg-card rounded-xl border border-border">
          <View className="mb-4">
            <AppInput
              label="Ad Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. iPhone 13 Pro 128GB"
              accessibilityLabel="Ad Title input"
            />
          </View>

          <View className="mb-4">
            <AppInput
              label="Price (₹) *"
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 45000"
              keyboardType="numeric"
              accessibilityLabel="Price input"
            />
          </View>

          <View className="mb-2">
            <AppInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe condition, specs, reason for selling..."
              multiline
              numberOfLines={4}
              className="min-h-[100px] text-top"
              accessibilityLabel="Description input"
            />
          </View>
        </Card>

        <AppButton
          label="Save Changes"
          onPress={handleSave}
          loading={updateMutation.isPending}
          className="mb-8 bg-brand-600 hover:bg-brand-700"
          accessibilityLabel="Save Changes"
        />
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
          <ActivityIndicator size="large" color={base.brand[500]} />
        </Container>
      </Screen>
    );
  }

  return <EditListingForm key={listing.id} id={id} listing={listing} />;
}
