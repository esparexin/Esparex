/**
 * ESPAREX — CREDIT RULES ENGINE
 * Single Source of Truth for dynamic credit cost calculation.
 * Evaluates Category, Location, and UserRole rules against CreditRule model.
 */
import mongoose from 'mongoose';
import CreditRule from '../../../models/CreditRule';
import { getAdPostingBalance } from '../../../domains/boosts/application/services/AdSlotService';
import type { CreditEvaluationInput, CreditEvaluationOutput } from '@esparex/contracts';

export class CreditRulesEngine {
  /**
   * Evaluates the required credit cost for a listing based on category, location, and user role.
   * Defaults to 1 Credit if no specific matching rule exists.
   */
  static async evaluateListingCost(
    input: CreditEvaluationInput & { userRole?: 'normal' | 'business' }
  ): Promise<number> {
    const { categoryId, locationId, userRole = 'normal' } = input;

    const query: Record<string, unknown> = { active: true };

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
      query.locationId = new mongoose.Types.ObjectId(locationId);
    }

    query.userRole = { $in: [userRole, 'all'] };

    const matchingRule = await CreditRule.findOne(query)
      .sort({ categoryId: -1, locationId: -1 })
      .lean();

    if (matchingRule && typeof matchingRule.requiredCredits === 'number') {
      return Math.max(0, matchingRule.requiredCredits);
    }

    // Default fallback: 1 credit per listing
    return 1;
  }

  /**
   * Performs full credit evaluation for a user attempting to post a listing.
   */
  static async evaluateUserEntitlement(
    userId: string,
    input: CreditEvaluationInput & { userRole?: 'normal' | 'business' }
  ): Promise<CreditEvaluationOutput> {
    const requiredCredits = await CreditRulesEngine.evaluateListingCost(input);
    const balance = await getAdPostingBalance(userId);

    let eligibleSource: 'PROMOTIONAL' | 'MONTHLY_FREE' | 'PURCHASED' | 'SUBSCRIPTION' = 'MONTHLY_FREE';
    if (balance.freeRemaining >= requiredCredits) {
      eligibleSource = 'MONTHLY_FREE';
    } else if (balance.paidCredits >= requiredCredits) {
      eligibleSource = 'PURCHASED';
    }

    const canAfford = balance.totalRemaining >= requiredCredits;

    return {
      requiredCredits,
      effectiveCost: requiredCredits,
      canAfford,
      eligibleSource,
    };
  }
}
