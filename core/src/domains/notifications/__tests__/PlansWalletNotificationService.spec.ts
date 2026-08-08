import { PlansWalletNotificationService } from '../application/PlansWalletNotificationService';

describe('PlansWalletNotificationService', () => {
  it('should return empty summary for missing user ID', async () => {
    const summary = await PlansWalletNotificationService.evaluateExpiryNotifications('');
    expect(summary.expiringSubscription).toBe(false);
    expect(summary.expiringPacksCount).toBe(0);
    expect(summary.lowCreditWarning).toBe(false);
  });
});
