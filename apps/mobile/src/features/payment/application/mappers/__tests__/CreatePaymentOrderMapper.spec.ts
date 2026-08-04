import { CreatePaymentOrderMapper } from '../CreatePaymentOrderMapper';

describe('CreatePaymentOrderMapper', () => {
  it('correctly trims and validates planId for order payload', () => {
    const rawPlanId = '  60d5ec49f1b2c80015f8e123  ';
    const payload = CreatePaymentOrderMapper.toPayload(rawPlanId);

    expect(payload.planId).toBe('60d5ec49f1b2c80015f8e123');
  });

  it('throws an error for empty or invalid planId', () => {
    expect(() => CreatePaymentOrderMapper.toPayload('')).toThrow('Invalid planId');
  });
});
