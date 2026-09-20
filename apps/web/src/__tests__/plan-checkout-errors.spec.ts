import { describe, it, expect } from 'vitest';
import { mapRazorpayPaymentFailure, type RazorpayErrorDetail } from '@/hooks/usePlanCheckout';

describe('mapRazorpayPaymentFailure', () => {
  it('maps international card rejection to clear domestic payment guidance', () => {
    const error: RazorpayErrorDetail = {
      code: 'BAD_REQUEST_ERROR',
      description: 'International cards are not supported. Please contact our support team for help',
      source: 'business',
      step: 'payment_initiation',
      reason: 'international_transaction_not_allowed',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe(
      'International cards are not supported. Please use an Indian domestic debit/credit card, UPI, or Netbanking.'
    );
  });

  it('maps foreign currency or unsupported country errors to domestic payment guidance', () => {
    const error: RazorpayErrorDetail = {
      code: 'BAD_REQUEST_ERROR',
      description: 'Foreign card issuing country not supported for this currency',
      reason: 'currency_not_supported',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe(
      'International cards are not supported. Please use an Indian domestic debit/credit card, UPI, or Netbanking.'
    );
  });

  it('maps user cancellation to cancellation notice', () => {
    const error: RazorpayErrorDetail = {
      code: 'BAD_REQUEST_ERROR',
      description: 'Payment was cancelled by user',
      reason: 'payment_cancelled',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe('Payment process was closed without completing.');
  });

  it('maps card/bank decline and insufficient funds to bank decline guidance', () => {
    const error: RazorpayErrorDetail = {
      code: 'GATEWAY_ERROR',
      description: 'Card declined due to insufficient funds',
      reason: 'payment_declined',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe(
      'Payment was declined by your bank or card issuer. Please check your card balance or try UPI / another card.'
    );
  });

  it('maps authentication / OTP failure to authentication guidance', () => {
    const error: RazorpayErrorDetail = {
      code: 'BAD_REQUEST_ERROR',
      description: 'OTP timed out or failed 3DS verification',
      reason: 'payment_authentication_failed',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe('Payment authentication failed or timed out. Please try again.');
  });

  it('maps rate limit errors to rate limit guidance', () => {
    const error: RazorpayErrorDetail = {
      code: 'RATE_LIMIT_ERROR',
      description: 'Too many payment requests. Please try later.',
      reason: 'rate_limit_exceeded',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe('Too many payment attempts detected. Please wait a few moments before trying again.');
  });

  it('maps temporarily unavailable methods to alternative method guidance', () => {
    const error: RazorpayErrorDetail = {
      code: 'GATEWAY_ERROR',
      description: 'Gateway error: Netbanking temporarily unavailable for selected bank',
      reason: 'payment_method_not_available',
    };

    const message = mapRazorpayPaymentFailure(error);
    expect(message).toBe(
      'The selected payment method is temporarily unavailable. Please try an alternative such as UPI or Netbanking.'
    );
  });

  it('returns actionable fallback when error details are empty or unrecognized', () => {
    expect(mapRazorpayPaymentFailure(undefined)).toBe(
      'Payment could not be processed. Please verify your details or try using UPI, Netbanking, or an Indian domestic card.'
    );
    expect(mapRazorpayPaymentFailure({})).toBe(
      'Payment could not be processed. Please verify your details or try using UPI, Netbanking, or an Indian domestic card.'
    );
  });
});
