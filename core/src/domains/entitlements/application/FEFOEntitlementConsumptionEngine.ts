import { Types, ClientSession } from 'mongoose';
import Entitlement from '../../../models/Entitlement';
import CreditTransaction from '../../../models/CreditTransaction';
import type { EntitlementType } from '@esparex/contracts';

export interface ConsumeEntitlementParams {
  userId: string;
  type: EntitlementType;
  amount?: number;
  reason?: string;
  listingId?: string;
  session?: ClientSession;
}

export interface ConsumptionResult {
  success: boolean;
  consumedTotal: number;
  packsAffected: string[];
}

export class FEFOEntitlementConsumptionEngine {
  /**
   * Consumes entitlements according to strict FEFO (First Expiring, First Out) policy.
   * Priority: Packs with earliest expiresAt ASC. Null expiresAt (never expiring) placed LAST.
   * Tie-breaker: createdAt ASC.
   */
  public static async consumeFEFO(params: ConsumeEntitlementParams): Promise<ConsumptionResult> {
    const { userId, type, amount = 1, reason = 'Entitlement FEFO Debit', listingId, session } = params;

    if (!userId || amount <= 0) {
      throw new Error('Valid userId and positive amount are required for FEFO entitlement consumption.');
    }

    const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

    // Fetch active entitlement packs with remaining quota
    const packs = await Entitlement.find({
      userId: userObjId,
      type,
      status: 'ACTIVE',
      remaining: { $gt: 0 },
    })
      .session(session || null)
      .lean();

    if (!packs || packs.length === 0) {
      return { success: false, consumedTotal: 0, packsAffected: [] };
    }

    // FEFO Sort: expiresAt ASC (nulls last), then createdAt ASC
    const sortedPacks = packs.sort((a, b) => {
      if (a.expiresAt && b.expiresAt) {
        const diff = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        if (diff !== 0) return diff;
      } else if (a.expiresAt && !b.expiresAt) {
        return -1; // null expiresAt placed last
      } else if (!a.expiresAt && b.expiresAt) {
        return 1;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    let remainingNeeded = amount;
    let consumedTotal = 0;
    const packsAffected: string[] = [];

    for (const pack of sortedPacks) {
      if (remainingNeeded <= 0) break;

      const availableInPack = pack.remaining || 0;
      const toDeduct = Math.min(remainingNeeded, availableInPack);

      const newConsumed = (pack.consumed || 0) + toDeduct;
      const newRemaining = availableInPack - toDeduct;
      const newStatus = newRemaining === 0 ? 'EXHAUSTED' : 'ACTIVE';

      await Entitlement.updateOne(
        { _id: pack._id },
        {
          $set: {
            consumed: newConsumed,
            remaining: newRemaining,
            status: newStatus,
          },
        },
        { session: session || undefined }
      );

      remainingNeeded -= toDeduct;
      consumedTotal += toDeduct;
      packsAffected.push(pack._id.toString());
    }

    if (consumedTotal > 0) {
      // Record audit ledger debit transaction
      await CreditTransaction.create(
        [
          {
            userId: userObjId,
            listingId: listingId && Types.ObjectId.isValid(listingId) ? new Types.ObjectId(listingId) : undefined,
            type: 'DEBIT',
            creditPool: 'PURCHASED',
            amount: consumedTotal,
            reason: `${reason} (FEFO consumed ${packsAffected.length} packs)`,
            metadata: { packsAffected },
          },
        ],
        { session: session || undefined }
      );
    }

    return {
      success: consumedTotal >= amount,
      consumedTotal,
      packsAffected,
    };
  }
}
