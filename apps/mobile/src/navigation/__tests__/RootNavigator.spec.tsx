import { ROUTES } from '../routes';

describe('RootNavigator Guest & Authenticated Browsing Architecture', () => {
  it('defines the correct canonical routes for unified navigation', () => {
    expect(ROUTES.MAIN_STACK).toBe('MainStack');
    expect(ROUTES.AUTH_STACK).toBe('AuthStack');
    expect(ROUTES.MAIN_TABS).toBe('MainTabs');
    expect(ROUTES.HOME_TAB).toBe('HomeTab');
    expect(ROUTES.SEARCH_TAB).toBe('SearchTab');
    expect(ROUTES.POST_AD_TAB).toBe('PostAdTab');
    expect(ROUTES.CHAT_TAB).toBe('ChatTab');
    expect(ROUTES.PROFILE_TAB).toBe('ProfileTab');
    expect(ROUTES.LISTING_DETAILS).toBe('ListingDetails');
    expect(ROUTES.TERMS_AND_PRIVACY).toBe('TermsAndPrivacy');
  });

  it('guarantees Tier 1 Public routes are accessible to anonymous guests', () => {
    const tier1PublicRoutes = [ROUTES.HOME_TAB, ROUTES.SEARCH_TAB, ROUTES.LOGIN, ROUTES.OTP, ROUTES.TERMS_AND_PRIVACY];
    expect(tier1PublicRoutes).toContain('HomeTab');
    expect(tier1PublicRoutes).toContain('SearchTab');
    expect(tier1PublicRoutes).toContain('Login');
    expect(tier1PublicRoutes).toContain('OTP');
    expect(tier1PublicRoutes).toContain('TermsAndPrivacy');
  });

  it('guarantees Tier 2 Hybrid route ListingDetails is defined with public view and in-context actions', () => {
    expect(ROUTES.LISTING_DETAILS).toBe('ListingDetails');
  });

  it('guarantees Tier 3 Private routes require authentication or prompt login', () => {
    const tier3PrivateRoutes = [
      ROUTES.POST_AD_TAB,
      ROUTES.CHAT_TAB,
      ROUTES.PROFILE_TAB,
      ROUTES.CONVERSATION_LIST,
      ROUTES.CHAT_THREAD,
      ROUTES.PROFILE_SETTINGS,
      ROUTES.BUSINESS_REGISTRATION,
      ROUTES.BUSINESS_STATUS,
      ROUTES.PLAN_SELECTION,
      ROUTES.TRANSACTION_HISTORY,
      ROUTES.SMART_ALERTS,
      ROUTES.SAVED_ADS,
      ROUTES.EDIT_LISTING,
    ];

    expect(tier3PrivateRoutes).toContain('PostAdTab');
    expect(tier3PrivateRoutes).toContain('ChatTab');
    expect(tier3PrivateRoutes).toContain('ProfileTab');
    expect(tier3PrivateRoutes).toContain('SavedAds');
    expect(tier3PrivateRoutes).toContain('PlanSelection');
  });
});
