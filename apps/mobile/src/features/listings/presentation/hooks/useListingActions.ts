import { useCallback, useMemo } from 'react';
import { Alert, Linking, Share } from 'react-native';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { services } from '../../../../bootstrap';
import { Listing } from '../../domain/Listing';
import { ActionDef } from '../components/details/ActionBar';

interface UseListingActionsParams {
  id: string;
  listing?: Listing | null;
  isSaved: boolean;
  isOwner: boolean;
  authStatus: string;
  toggleSave: (params: { adId: string; isSaved: boolean }) => void;
  onOpenReportModal: () => void;
}

export function useListingActions({
  id,
  listing,
  isSaved,
  isOwner,
  authStatus,
  toggleSave,
  onOpenReportModal,
}: UseListingActionsParams) {
  const handleToggleFavorite = useCallback(() => {
    if (authStatus !== 'authenticated') {
      navigate(ROUTES.AUTH_STACK);
      return;
    }
    toggleSave({ adId: id, isSaved });
  }, [authStatus, id, isSaved, toggleSave]);

  const handleShare = useCallback(async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `Check out ${listing.title} on Esparex: ${listing.price.formatted}`,
      });
    } catch {
      // ignore
    }
  }, [listing]);

  const handleEditPress = useCallback(() => {
    navigate(ROUTES.MAIN_STACK, {
      screen: ROUTES.MAIN_TABS,
      params: {
        screen: ROUTES.PROFILE_TAB,
        params: {
          screen: ROUTES.EDIT_LISTING,
          params: { id },
        },
      },
    });
  }, [id]);

  const handleMessagePress = useCallback(() => {
    if (authStatus !== 'authenticated') {
      navigate(ROUTES.AUTH_STACK);
      return;
    }

    Alert.alert(
      'Contact Seller',
      'Safety Reminder: Never pay in advance or send money online before inspecting items in person.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Chat',
          onPress: async () => {
            try {
              const conversationId = await services.chatService.startChat(id);
              if (conversationId) {
                navigate(ROUTES.MAIN_STACK, {
                  screen: ROUTES.MAIN_TABS,
                  params: {
                    screen: ROUTES.CHAT_TAB,
                    params: {
                      screen: ROUTES.CHAT_THREAD,
                      params: { conversationId },
                    },
                  },
                });
              }
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Please try again later.';
              Alert.alert('Unable to start chat', errorMessage);
            }
          },
        },
      ]
    );
  }, [authStatus, id]);

  const handleCallPress = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      navigate(ROUTES.AUTH_STACK);
      return;
    }

    try {
      const contact = await services.listingService.getListingPhone(id);
      const phoneNumber = contact?.phone || contact?.mobile;

      if (!phoneNumber) {
        if (contact?.masked) {
          Alert.alert(
            'Contact Seller',
            "Seller contact is protected. Please use chat to request the seller's phone number.",
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Start Chat', onPress: handleMessagePress },
            ]
          );
          return;
        }

        Alert.alert(
          'Phone Unavailable',
          contact?.error || 'Seller chose not to share a phone number for this listing.'
        );
        return;
      }

      Alert.alert(
        'Call Seller',
        `Do you want to make a call to ${listing?.seller.name || 'the seller'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
        ]
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Please try again later.';
      Alert.alert('Unable to contact seller', errorMessage);
    }
  }, [authStatus, handleMessagePress, id, listing]);

  const handleReportPress = useCallback(() => {
    if (authStatus !== 'authenticated') {
      navigate(ROUTES.AUTH_STACK);
      return;
    }
    onOpenReportModal();
  }, [authStatus, onOpenReportModal]);

  const actions: ActionDef[] = useMemo(
    () =>
      isOwner
        ? [
            {
              label: 'Edit Listing',
              onPress: handleEditPress,
              isPrimary: true,
              variant: 'primary',
            },
          ]
        : [
            {
              label: 'Call Seller',
              onPress: handleCallPress,
              isPrimary: false,
              variant: 'outline',
            },
            {
              label: 'Chat / Message',
              onPress: handleMessagePress,
              isPrimary: true,
              variant: 'primary',
            },
          ],
    [handleCallPress, handleEditPress, handleMessagePress, isOwner]
  );

  return {
    handleToggleFavorite,
    handleShare,
    handleEditPress,
    handleMessagePress,
    handleCallPress,
    handleReportPress,
    actions,
  };
}
