import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  LEGAL_GRIEVANCE_OFFICER,
  LEGAL_GRIEVANCE_DESIGNATION,
  LEGAL_COMPANY_NAME,
  LEGAL_GRIEVANCE_EMAIL,
  LEGAL_SUPPORT_PHONE,
  LEGAL_TIMELINES_ACKNOWLEDGMENT,
  LEGAL_TIMELINES_DISPOSAL,
  LEGAL_WEB_TERMS_URL,
  LEGAL_WEB_PRIVACY_URL,
} from '@esparex/shared';
import { TermsAndPrivacyScreen } from '../TermsAndPrivacyScreen';
import { navigate } from '../../../../../navigation/navigationRef';
import { ROUTES } from '../../../../../navigation/routes';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../../../../navigation/navigationRef', () => ({
  navigate: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

describe('TermsAndPrivacyScreen', () => {
  const mockGoBack = jest.fn();
  const mockParentGoBack = jest.fn();
  let mockCanGoBack = jest.fn();
  let mockParentCanGoBack = jest.fn();
  let backHandlerCallback: (() => boolean | null | undefined) | null = null;
  const mockRemoveSubscription = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = jest.fn().mockReturnValue(true);
    mockParentCanGoBack = jest.fn().mockReturnValue(false);

    (useNavigation as jest.Mock).mockReturnValue({
      goBack: mockGoBack,
      canGoBack: mockCanGoBack,
      getParent: () => ({
        goBack: mockParentGoBack,
        canGoBack: mockParentCanGoBack,
      }),
    });

    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallback = handler;
      }
      return { remove: mockRemoveSubscription };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    backHandlerCallback = null;
  });

  describe('Header & Navigation Resilience', () => {
    it('renders the header title and accessible back button', () => {
      const { getByText, getByLabelText } = render(<TermsAndPrivacyScreen />);

      expect(getByText('Terms & Privacy Policy')).toBeTruthy();
      expect(getByText('Legal Governance & Compliance')).toBeTruthy();
      expect(getByLabelText('Go back')).toBeTruthy();
    });

    it('navigates back when canGoBack is true', () => {
      mockCanGoBack.mockReturnValue(true);
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Go back'));

      expect(mockGoBack).toHaveBeenCalledTimes(1);
      expect(mockParentGoBack).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('falls back to parent navigation when canGoBack is false but parent canGoBack is true', () => {
      mockCanGoBack.mockReturnValue(false);
      mockParentCanGoBack.mockReturnValue(true);
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Go back'));

      expect(mockGoBack).not.toHaveBeenCalled();
      expect(mockParentGoBack).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('falls back to MAIN_STACK when neither navigator can go back', () => {
      mockCanGoBack.mockReturnValue(false);
      mockParentCanGoBack.mockReturnValue(false);
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Go back'));

      expect(mockGoBack).not.toHaveBeenCalled();
      expect(mockParentGoBack).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(ROUTES.MAIN_STACK);
    });

    it('handles Android hardware back button press', () => {
      mockCanGoBack.mockReturnValue(true);
      render(<TermsAndPrivacyScreen />);

      expect(backHandlerCallback).not.toBeNull();
      const result = backHandlerCallback ? backHandlerCallback() : false;

      expect(result).toBe(true);
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('cleans up Android BackHandler subscription on unmount', () => {
      const { unmount } = render(<TermsAndPrivacyScreen />);

      unmount();

      expect(mockRemoveSubscription).toHaveBeenCalledTimes(1);
    });
  });

  describe('Section Filtering', () => {
    it('renders all sections when "All" tab is active by default', () => {
      const { getByText } = render(<TermsAndPrivacyScreen />);

      expect(getByText('1. Platform Nature & Intermediary Role')).toBeTruthy();
      expect(getByText('2. User Eligibility (18+ Requirement)')).toBeTruthy();
      expect(getByText('3. Safety & In-Person Inspection')).toBeTruthy();
      expect(getByText('4. Prohibited Content & Goods')).toBeTruthy();
      expect(getByText('5. Paid Promotions & No-Refund Policy')).toBeTruthy();
      expect(getByText('6. Privacy, DPDP Act 2023 & Account Deletion')).toBeTruthy();
      expect(getByText('7. Statutory Grievance Redressal')).toBeTruthy();
    });

    it('filters to show only Terms sections when "Terms of Service" tab is pressed', () => {
      const { getByLabelText, getByText, queryByText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Filter by Terms of Service'));

      expect(getByText('1. Platform Nature & Intermediary Role')).toBeTruthy();
      expect(getByText('2. User Eligibility (18+ Requirement)')).toBeTruthy();
      expect(getByText('4. Prohibited Content & Goods')).toBeTruthy();
      expect(getByText('5. Paid Promotions & No-Refund Policy')).toBeTruthy();

      // Non-terms sections should be hidden
      expect(queryByText('3. Safety & In-Person Inspection')).toBeNull();
      expect(queryByText('6. Privacy, DPDP Act 2023 & Account Deletion')).toBeNull();
      expect(queryByText('7. Statutory Grievance Redressal')).toBeNull();
    });

    it('filters to show only Privacy section when "Privacy Policy" tab is pressed', () => {
      const { getByLabelText, getByText, queryByText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Filter by Privacy Policy'));

      expect(getByText('6. Privacy, DPDP Act 2023 & Account Deletion')).toBeTruthy();

      expect(queryByText('1. Platform Nature & Intermediary Role')).toBeNull();
      expect(queryByText('2. User Eligibility (18+ Requirement)')).toBeNull();
      expect(queryByText('3. Safety & In-Person Inspection')).toBeNull();
      expect(queryByText('7. Statutory Grievance Redressal')).toBeNull();
    });

    it('filters to show Safety and Grievance sections when "Safety & Grievance" tab is pressed', () => {
      const { getByLabelText, getByText, queryByText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Filter by Safety & Grievance'));

      expect(getByText('3. Safety & In-Person Inspection')).toBeTruthy();
      expect(getByText('7. Statutory Grievance Redressal')).toBeTruthy();

      expect(queryByText('1. Platform Nature & Intermediary Role')).toBeNull();
      expect(queryByText('2. User Eligibility (18+ Requirement)')).toBeNull();
      expect(queryByText('6. Privacy, DPDP Act 2023 & Account Deletion')).toBeNull();
    });
  });

  describe('Statutory Legal Disclosures & Grievance Officer', () => {
    it('displays the canonical Grievance Officer details and statutory timelines', () => {
      const { getByText, getAllByText } = render(<TermsAndPrivacyScreen />);

      expect(getByText(LEGAL_GRIEVANCE_OFFICER, { exact: false })).toBeTruthy();
      expect(getByText(LEGAL_GRIEVANCE_DESIGNATION, { exact: false })).toBeTruthy();
      expect(getAllByText(LEGAL_COMPANY_NAME, { exact: false }).length).toBeGreaterThan(0);
      expect(getByText(LEGAL_GRIEVANCE_EMAIL, { exact: false })).toBeTruthy();
      expect(getByText(LEGAL_SUPPORT_PHONE, { exact: false })).toBeTruthy();
      expect(getByText(LEGAL_TIMELINES_ACKNOWLEDGMENT, { exact: false })).toBeTruthy();
      expect(getByText(LEGAL_TIMELINES_DISPOSAL, { exact: false })).toBeTruthy();
    });
  });

  describe('Interactive External Actions', () => {
    it('triggers mailto link when "Email Grievance Officer" is pressed', () => {
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Email the Grievance Officer'));

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(`mailto:${LEGAL_GRIEVANCE_EMAIL}`)
      );
    });

    it('triggers tel link when "Call Grievance Officer" is pressed', () => {
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Call the Grievance Officer'));

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('tel:')
      );
    });

    it('opens the canonical Web Terms URL when "Full Terms on Web" is pressed', () => {
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Open Full Terms of Service on Web'));

      expect(Linking.openURL).toHaveBeenCalledWith(LEGAL_WEB_TERMS_URL);
    });

    it('opens the canonical Web Privacy URL when "Full Privacy Policy on Web" is pressed', () => {
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      fireEvent.press(getByLabelText('Open Full Privacy Policy on Web'));

      expect(Linking.openURL).toHaveBeenCalledWith(LEGAL_WEB_PRIVACY_URL);
    });
  });

  describe('Accessibility Compliance', () => {
    it('verifies accessibility roles and labels for interactive controls', () => {
      const { getByLabelText } = render(<TermsAndPrivacyScreen />);

      const backBtn = getByLabelText('Go back');
      expect(backBtn.props.accessibilityRole).toBe('button');

      const termsTab = getByLabelText('Filter by Terms of Service');
      expect(termsTab.props.accessibilityRole).toBe('tab');

      const emailBtn = getByLabelText('Email the Grievance Officer');
      expect(emailBtn.props.accessibilityRole).toBe('button');

      const webTermsLink = getByLabelText('Open Full Terms of Service on Web');
      expect(webTermsLink.props.accessibilityRole).toBe('link');
    });
  });
});
