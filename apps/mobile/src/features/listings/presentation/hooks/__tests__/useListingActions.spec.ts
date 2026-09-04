import { renderHook, act } from '@testing-library/react-native';
import { Alert, Linking, Share } from 'react-native';
import { useListingActions } from '../useListingActions';
import { navigate } from '../../../../../navigation/navigationRef';
import { ROUTES } from '../../../../../navigation/routes';
import { services } from '../../../../../bootstrap';
import { Listing } from '../../../domain/Listing';

jest.mock('../../../../../navigation/navigationRef', () => ({ navigate: jest.fn() }));
jest.mock('../../../../../bootstrap', () => ({
  services: {
    listingService: { getListingPhone: jest.fn(), incrementListingView: jest.fn() },
    chatService: { startChat: jest.fn() },
  },
}));

describe('useListingActions', () => {
  const mockNavigate = navigate as jest.Mock;
  const mockGetListingPhone = services.listingService.getListingPhone as jest.Mock;
  const mockToggleSave = jest.fn();
  const mockOnOpenReportModal = jest.fn();

  const sampleListing: Listing = {
    id: '64d2f1f4f1d2b1a1c8e4a999',
    title: 'iPhone 13 128GB Midnight',
    description: 'Battery health 88%',
    price: { amount: 35000, currency: 'INR', formatted: '₹35,000' },
    seller: { id: 'usr-seller-1', name: 'John Doe', type: 'user', isVerified: true },
    images: [{ url: 'https://example.com/pic.jpg', isPrimary: true }],
    status: 'active',
    createdAt: new Date(),
    isFeatured: false,
    isPremium: false,
  };

  const renderActions = (overrides = {}) =>
    renderHook(() =>
      useListingActions({
        id: sampleListing.id,
        listing: sampleListing,
        isSaved: false,
        isOwner: false,
        authStatus: 'authenticated',
        toggleSave: mockToggleSave,
        onOpenReportModal: mockOnOpenReportModal,
        ...overrides,
      })
    );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  it('redirects to auth when unauthenticated user toggles favorite', () => {
    const { result } = renderActions({ authStatus: 'unauthenticated' });
    act(() => { result.current.handleToggleFavorite(); });
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.AUTH_STACK);
    expect(mockToggleSave).not.toHaveBeenCalled();
  });

  it('calls toggleSave when authenticated user toggles favorite', () => {
    const { result } = renderActions({ isSaved: true });
    act(() => { result.current.handleToggleFavorite(); });
    expect(mockToggleSave).toHaveBeenCalledWith({ adId: sampleListing.id, isSaved: true });
  });

  it('shares listing title and formatted price via Native Share', async () => {
    const { result } = renderActions();
    await act(async () => { await result.current.handleShare(); });
    expect(Share.share).toHaveBeenCalledWith({
      title: 'iPhone 13 128GB Midnight',
      message: 'Check out iPhone 13 128GB Midnight on Esparex: ₹35,000',
    });
  });

  it('configures Edit Listing action when viewer is the owner', () => {
    const { result } = renderActions({ isOwner: true });
    expect(result.current.actions).toHaveLength(1);
    expect(result.current.actions[0].label).toBe('Edit Listing');
    act(() => { result.current.actions[0].onPress(); });
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MAIN_STACK, {
      screen: ROUTES.MAIN_TABS,
      params: { screen: ROUTES.PROFILE_TAB, params: { screen: ROUTES.EDIT_LISTING, params: { id: sampleListing.id } } },
    });
  });

  it('configures Call and Chat actions when viewer is not the owner', () => {
    const { result } = renderActions({ isOwner: false });
    expect(result.current.actions).toHaveLength(2);
    expect(result.current.actions[0].label).toBe('Call Seller');
    expect(result.current.actions[1].label).toBe('Chat / Message');
  });

  it('fetches real phone number dynamically and prompts to call seller', async () => {
    mockGetListingPhone.mockResolvedValueOnce({ phone: '+919876543210' });
    const { result } = renderActions();
    await act(async () => { await result.current.handleCallPress(); });
    expect(mockGetListingPhone).toHaveBeenCalledWith(sampleListing.id);
    expect(Alert.alert).toHaveBeenCalledWith('Call Seller', 'Do you want to make a call to John Doe?', expect.any(Array));

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const callBtn = alertButtons.find((b: { text: string }) => b.text === 'Call');
    callBtn.onPress();
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+919876543210');
  });

  it('alerts user when phone is protected/masked and offers chat fallback', async () => {
    mockGetListingPhone.mockResolvedValueOnce({ masked: true });
    const { result } = renderActions();
    await act(async () => { await result.current.handleCallPress(); });
    expect(mockGetListingPhone).toHaveBeenCalledWith(sampleListing.id);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Contact Seller',
      "Seller contact is protected. Please use chat to request the seller's phone number.",
      expect.any(Array)
    );
  });
});
