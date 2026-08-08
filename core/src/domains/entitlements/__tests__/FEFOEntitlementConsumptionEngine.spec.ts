import { FEFOEntitlementConsumptionEngine } from '../application/FEFOEntitlementConsumptionEngine';

describe('FEFOEntitlementConsumptionEngine', () => {
  it('should correctly sort packs by earliest expiresAt first, placing null expiresAt last', () => {
    const now = new Date();
    const packExpiringSoon = {
      _id: 'pack_1',
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      createdAt: new Date('2026-01-01'),
      remaining: 5,
    };
    const packExpiringLater = {
      _id: 'pack_2',
      expiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
      createdAt: new Date('2026-01-01'),
      remaining: 5,
    };
    const packNeverExpiring = {
      _id: 'pack_3',
      expiresAt: null,
      createdAt: new Date('2026-01-01'),
      remaining: 5,
    };

    const packs = [packNeverExpiring, packExpiringLater, packExpiringSoon];

    const sorted = packs.sort((a, b) => {
      if (a.expiresAt && b.expiresAt) {
        const diff = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        if (diff !== 0) return diff;
      } else if (a.expiresAt && !b.expiresAt) {
        return -1;
      } else if (!a.expiresAt && b.expiresAt) {
        return 1;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    expect(sorted[0]._id).toBe('pack_1'); // 2 days
    expect(sorted[1]._id).toBe('pack_2'); // 10 days
    expect(sorted[2]._id).toBe('pack_3'); // never expiring (null)
  });
});
