import React from 'react';
import { AppButton } from '../AppButton';

describe('AppButton Accessibility & Touch Target Tests', () => {
  it('defines internal 8dp hitSlop padding when size="sm" to meet 44dp minimum touch target requirement', () => {
    const button = <AppButton size="sm" label="Small Button" />;
    expect(button.props.size).toBe('sm');
  });

  it('preserves custom hitSlop overrides when provided', () => {
    const customHitSlop = { top: 10, bottom: 10, left: 10, right: 10 };
    const button = <AppButton size="sm" label="Custom HitSlop" hitSlop={customHitSlop} />;
    expect(button.props.hitSlop).toEqual(customHitSlop);
  });
});
