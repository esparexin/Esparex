import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList, ROUTES } from './routes';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['esparex://'],
  config: {
    screens: {
      [ROUTES.AUTH_STACK]: {
        screens: {
          [ROUTES.LOGIN]: 'login',
          [ROUTES.OTP]: 'otp',
        },
      },
      [ROUTES.MAIN_STACK]: {
        screens: {
          [ROUTES.MAIN_TABS]: {
            screens: {
              [ROUTES.HOME_TAB]: 'home',
              [ROUTES.SEARCH_TAB]: 'search',
              [ROUTES.POST_AD_TAB]: 'post',
              // Chat nested screens: esparex://chat, esparex://chat/thread/:conversationId
              [ROUTES.CHAT_TAB]: {
                screens: {
                  [ROUTES.CONVERSATION_LIST]: 'chat',
                  [ROUTES.CHAT_THREAD]: 'chat/thread/:conversationId',
                },
              },
              // Profile nested screens
              [ROUTES.PROFILE_TAB]: {
                screens: {
                  [ROUTES.PROFILE_OVERVIEW]: 'profile',
                  [ROUTES.PROFILE_SETTINGS]: 'profile/settings',
                  [ROUTES.MY_LISTINGS]: 'profile/my-listings',
                  [ROUTES.SAVED_ADS]: 'profile/saved-ads',
                  [ROUTES.SMART_ALERTS]: 'profile/smart-alerts',
                  [ROUTES.PLAN_SELECTION]: 'profile/plans',
                  [ROUTES.TRANSACTION_HISTORY]: 'profile/transactions',
                  [ROUTES.BUSINESS_STATUS]: 'profile/business',
                  [ROUTES.BUSINESS_REGISTRATION]: 'profile/business/register',
                  [ROUTES.EDIT_LISTING]: 'profile/listing/:id/edit',
                  [ROUTES.TERMS_AND_PRIVACY]: 'profile/terms-and-privacy',
                },
              },
            },
          },
          [ROUTES.LISTING_DETAILS]: 'listing/:id',
          [ROUTES.NOTIFICATIONS]: 'notifications',
        },
      },
    },
  },
};
