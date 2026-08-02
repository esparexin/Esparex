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

  // Chat nested screens
  CONVERSATION_LIST: 'ConversationList',
  CHAT_THREAD: 'ChatThread',

  // Profile nested screens
  PROFILE_OVERVIEW: 'ProfileOverview',
  PROFILE_SETTINGS: 'ProfileSettings',
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
  [ROUTES.CHAT_TAB]: NavigatorScreenParams<ChatStackParamList> | undefined;
  [ROUTES.PROFILE_TAB]: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

// Chat stack: list → thread
export type ChatStackParamList = {
  [ROUTES.CONVERSATION_LIST]: undefined;
  [ROUTES.CHAT_THREAD]: { conversationId: string };
};

// Profile stack: overview → settings
export type ProfileStackParamList = {
  [ROUTES.PROFILE_OVERVIEW]: undefined;
  [ROUTES.PROFILE_SETTINGS]: undefined;
};



