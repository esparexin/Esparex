/**
 * ESPAREX — CREDIT EVALUATION DTO CONTRACTS
 * Single Source of Truth for credit evaluation requests and balance responses.
 */

export interface CreditEvaluationInput {
  categoryId?: string;
  locationId?: string;
  listingType?: string;
}

export interface CreditEvaluationOutput {
  requiredCredits: number;
  effectiveCost: number;
  canAfford: boolean;
  eligibleSource: 'PROMOTIONAL' | 'MONTHLY_FREE' | 'PURCHASED' | 'SUBSCRIPTION';
}

export interface CreditWalletSummaryPayload {
  monthlyFree: {
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  purchased: {
    balance: number;
  };
  promotional: {
    balance: number;
  };
  subscription: {
    unlimited: boolean;
    activePlan?: string;
  };
  totalRemaining: number;
}
