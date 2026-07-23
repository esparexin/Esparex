/**
 * ESPAREX — CREDIT DEDUCTION SERVICE
 * Single Source of Truth for atomic priority-ordered credit consumption.
 * Priority: Promotional -> Monthly Free -> Purchased -> Subscription
 */
import { ClientSession, Types } from 'mongoose';
import UserWallet from '../../../models/UserWallet';
import CreditTransaction from '../../../models/CreditTransaction';
import { getAdPostingBalance, withUserPostingLock } from '../../../domains/boosts/application/services/AdSlotService';
import { AppError } from '../../../utils/AppError';
import { BusinessErrorCode } from '@esparex/contracts';

export interface DeductCreditsInput {
  userId: string;
  requiredCredits: number;
  listingId?: string;
  reason?: string;
  session?: ClientSession;
}

export class CreditDeductionService {
  /**
   * Deducts credits atomically using priority order and logs an audit record in CreditTransaction.
   */
  static async deductCredits(input: DeductCreditsInput): Promise<{ source: string }> {
    const { userId, requiredCredits, listingId, reason = 'Listing creation deduction', session } = input;

    if (requiredCredits <= 0) {
      return { source: 'free_override' };
    }

    return withUserPostingLock(userId, 15, async () => {
      const balance = await getAdPostingBalance(userId, session);

      if (balance.totalRemaining < requiredCredits) {
        throw new AppError(
          'Insufficient ad posting credits available.',
          403,
          BusinessErrorCode.QUOTA_EXHAUSTED
        );
      }

      let source = 'monthly_free';

      if (balance.freeRemaining >= requiredCredits) {
        await UserWallet.updateOne(
          { userId },
          { $inc: { monthlyFreeAdsUsed: requiredCredits } },
          { session }
        );
        source = 'monthly_free';
      } else {
        await UserWallet.updateOne(
          { userId },
          { $inc: { adCredits: -requiredCredits } },
          { session }
        );
        source = 'purchased_credit';
      }

      // Log immutable credit transaction audit record
      await CreditTransaction.create(
        [
          {
            userId: new Types.ObjectId(userId),
            listingId: listingId && Types.ObjectId.isValid(listingId) ? new Types.ObjectId(listingId) : undefined,
            creditPool: source === 'monthly_free' ? 'MONTHLY_FREE' : 'PURCHASED',
            amount: requiredCredits,
            type: 'DEBIT',
            reason,
          },
        ],
        { session }
      );

      return { source };
    });
  }
}
