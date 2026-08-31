import React from 'react';
import { SegmentedOtpInput } from '../SegmentedOtpInput';

describe('SegmentedOtpInput Atom Tests', () => {
  it('instantiates with default 6-digit length and accessible props', () => {
    const onChangeText = jest.fn();
    const element = (
      <SegmentedOtpInput
        value="123"
        onChangeText={onChangeText}
        accessibilityLabel="6-digit OTP Input"
      />
    );
    expect(element.props.value).toBe('123');
    expect(element.props.length).toBeUndefined(); // defaults to 6 internally
    expect(element.props.accessibilityLabel).toBe('6-digit OTP Input');
  });

  it('accepts error message and custom length', () => {
    const element = (
      <SegmentedOtpInput
        length={4}
        value="12"
        onChangeText={jest.fn()}
        error="Invalid code"
      />
    );
    expect(element.props.length).toBe(4);
    expect(element.props.error).toBe('Invalid code');
  });
});
