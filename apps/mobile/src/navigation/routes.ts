export const ROUTES = {
  // Stacks
  AUTH_STACK: 'AuthStack',
  MAIN_STACK: 'MainStack',

  // Auth Screens
  LOGIN: 'Login',
  OTP: 'OTP',

  // Main Stack Screens
  MAIN_TABS: 'MainTabs',
  LISTING_DETAILS: 'ListingDetails',
  NOTIFICATIONS: 'Notifications',

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
  MY_LISTINGS: 'MyListings',
  BUSINESS_REGISTRATION: 'BusinessRegistration',
  BUSINESS_STATUS: 'BusinessStatus',
  PLAN_SELECTION: 'PlanSelection',
  TRANSACTION_HISTORY: 'TransactionHistory',
  SMART_ALERTS: 'SmartAlerts',
  SAVED_ADS: 'SavedAds',
  EDIT_LISTING: 'EditListing',
  TERMS_AND_PRIVACY: 'TermsAndPrivacy',
} as const;

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  [ROUTES.AUTH_STACK]: NavigatorScreenParams<AuthStackParamList> | undefined;
  [ROUTES.MAIN_STACK]: NavigatorScreenParams<MainStackParamList> | undefined;
};

export type AuthStackParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.OTP]: { mobile: string; isNewUser?: boolean; name?: string } | undefined;
  [ROUTES.TERMS_AND_PRIVACY]: undefined;
};

export type MainStackParamList = {
  [ROUTES.MAIN_TABS]: NavigatorScreenParams<MainTabParamList> | undefined;
  [ROUTES.LISTING_DETAILS]: { id: string };
  [ROUTES.NOTIFICATIONS]: undefined;
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

// Profile stack: overview → settings → my listings → business → payment → smart alerts → saved ads → edit listing → terms
export type ProfileStackParamList = {
  [ROUTES.PROFILE_OVERVIEW]: undefined;
  [ROUTES.PROFILE_SETTINGS]: undefined;
  [ROUTES.MY_LISTINGS]: undefined;
  [ROUTES.BUSINESS_REGISTRATION]: undefined;
  [ROUTES.BUSINESS_STATUS]: undefined;
  [ROUTES.PLAN_SELECTION]: undefined;
  [ROUTES.TRANSACTION_HISTORY]: undefined;
  [ROUTES.SMART_ALERTS]: undefined;
  [ROUTES.SAVED_ADS]: undefined;
  [ROUTES.EDIT_LISTING]: { id: string };
  [ROUTES.TERMS_AND_PRIVACY]: undefined;
};



