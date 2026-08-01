import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList, ROUTES } from './routes';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['esparex://'],
  config: {
    screens: {
      [ROUTES.AUTH_STACK]: {
        screens: {
          [ROUTES.LOGIN]: 'login',
          [ROUTES.SIGNUP]: 'signup',
          [ROUTES.FORGOT_PASSWORD]: 'forgot-password',
        },
      },
      [ROUTES.MAIN_STACK]: {
        screens: {
          [ROUTES.MAIN_TABS]: {
            screens: {
              [ROUTES.HOME_TAB]: 'home',
              [ROUTES.SEARCH_TAB]: 'search',
              [ROUTES.POST_AD_TAB]: 'post',
              [ROUTES.CHAT_TAB]: 'chat',
              [ROUTES.PROFILE_TAB]: 'profile',
            }
          },
          [ROUTES.LISTING_DETAILS]: 'listing/:id',
        },
      },
    },
  },
};
