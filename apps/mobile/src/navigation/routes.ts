export const ROUTES = {
  // Stacks
  AUTH_STACK: 'AuthStack',
  MAIN_STACK: 'MainStack',

  // Auth Screens
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FORGOT_PASSWORD: 'ForgotPassword',
  OTP: 'OTP',

  // Main Stack Screens
  MAIN_TABS: 'MainTabs',
  LISTING_DETAILS: 'ListingDetails',

  // Tab Screens
  HOME_TAB: 'HomeTab',
  SEARCH_TAB: 'SearchTab',
  POST_AD_TAB: 'PostAdTab',
  CHAT_TAB: 'ChatTab',
  PROFILE_TAB: 'ProfileTab',
} as const;

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  [ROUTES.AUTH_STACK]: NavigatorScreenParams<AuthStackParamList> | undefined;
  [ROUTES.MAIN_STACK]: NavigatorScreenParams<MainStackParamList> | undefined;
};

export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.SIGNUP]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.OTP]: undefined;
};

export type MainStackParamList = {
  [ROUTES.MAIN_TABS]: undefined;
  [ROUTES.LISTING_DETAILS]: { id: string };
};

export type MainTabParamList = {
  [ROUTES.HOME_TAB]: undefined;
  [ROUTES.SEARCH_TAB]: undefined;
  [ROUTES.POST_AD_TAB]: undefined;
  [ROUTES.CHAT_TAB]: undefined;
  [ROUTES.PROFILE_TAB]: undefined;
};



