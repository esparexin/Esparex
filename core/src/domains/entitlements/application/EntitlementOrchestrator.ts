/**
 * ESPAREX — EntitlementOrchestrator.ts
 *
 * Platform-wide Single Source of Truth for posting entitlements across:
 * - Ads
 * - Services
 * - Spare Parts
 * - Smart Alerts
 *
 * Aggregates policy reads concurrently via Promise.allSettled without duplicating
 * decision logic from AdSlotService or ListingSubmissionPolicy.
 */

import { Types } from 'mongoose';
import {
  getAdPostingBalance,
} from '../../boosts/application/services/AdSlotService';
import { LISTING_TYPE, type PostingEntitlementMatrixDTO, type SingleEntitlementState } from '@esparex/contracts';
import { getListingRepository } from '../../../composition/listings';
import UserPlan from '../../../models/UserPlan';
import Entitlement from '../../../models/Entitlement';
import { calculateUserPlan } from '../../payments';
import logger from '../../../utils/logger';

export class EntitlementOrchestrator {
  /**
   * Fetches the complete posting entitlement matrix for a user.
   */
  static async getUserPostingEntitlementMatrix(userId: string): Promise<PostingEntitlementMatrixDTO> {
    const startTime = Date.now();

    const [adResult, serviceResult, sparePartsResult, alertsResult] = await Promise.allSettled([
      EntitlementOrchestrator.getAdEntitlement(userId),
      EntitlementOrchestrator.getServiceEntitlement(userId),
      EntitlementOrchestrator.getSparePartsEntitlement(userId),
      EntitlementOrchestrator.getSmartAlertsEntitlement(userId),
    ]);

    const durationMs = Date.now() - startTime;
    logger.info('[ENTITLEMENT_ORCHESTRATOR] Matrix generated', { userId, durationMs });

    return {
      ads: adResult.status === 'fulfilled' ? adResult.value : EntitlementOrchestrator.createFallbackState('QUOTA_EXHAUSTED', 'BUY_AD_PACK'),
      services: serviceResult.status === 'fulfilled' ? serviceResult.value : EntitlementOrchestrator.createFallbackState('SERVICE_UNAVAILABLE', 'CONTACT_SUPPORT'),
      spareParts: sparePartsResult.status === 'fulfilled' ? sparePartsResult.value : EntitlementOrchestrator.createFallbackState('SERVICE_UNAVAILABLE', 'CONTACT_SUPPORT'),
      smartAlerts: alertsResult.status === 'fulfilled' ? alertsResult.value : EntitlementOrchestrator.createFallbackState('SERVICE_UNAVAILABLE', 'CONTACT_SUPPORT'),
    };
  }

  private static async getAdEntitlement(userId: string): Promise<SingleEntitlementState> {
    const balance = await getAdPostingBalance(userId);
    const allowed = balance.totalRemaining > 0;

    return {
      allowed,
      reason: allowed ? 'OK' : 'QUOTA_EXHAUSTED',
      action: allowed ? 'POST' : 'BUY_AD_PACK',
      limit: balance.freeLimit,
      used: balance.freeUsed,
      remaining: balance.freeRemaining,
      paidCredits: balance.paidCredits,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    };
  }

  private static async getUserActivePlanPermissions(userId: string) {
    const activePlans = await UserPlan.find({
      userId,
      status: 'active',
      $or: [{ endDate: { $gte: new Date() } }, { endDate: null }],
    }).populate('planId').lean();

    const plans = activePlans.map((up) => (up as { planId: unknown }).planId).filter(Boolean);
    return calculateUserPlan(plans);
  }

  private static async getServiceEntitlement(userId: string): Promise<SingleEntitlementState> {
    const permissions = await EntitlementOrchestrator.getUserActivePlanPermissions(userId);
    const limit = permissions.maxServices || 100;

    const used = await getListingRepository().countActiveBySeller({
      sellerId: userId,
      listingType: LISTING_TYPE.SERVICE,
    });

    const remaining = Math.max(0, limit - used);
    const allowed = remaining > 0;

    return {
      allowed,
      reason: allowed ? 'OK' : 'ACTIVE_LIMIT_REACHED',
      action: allowed ? 'POST' : 'UPGRADE_PLAN',
      limit,
      used,
      remaining,
    };
  }

  private static async getSparePartsEntitlement(userId: string): Promise<SingleEntitlementState> {
    const permissions = await EntitlementOrchestrator.getUserActivePlanPermissions(userId);
    const limit = permissions.maxParts || 100;

    const used = await getListingRepository().countActiveBySeller({
      sellerId: userId,
      listingType: LISTING_TYPE.SPARE_PART,
    });

    const remaining = Math.max(0, limit - used);
    const allowed = remaining > 0;

    return {
      allowed,
      reason: allowed ? 'OK' : 'ACTIVE_LIMIT_REACHED',
      action: allowed ? 'POST' : 'UPGRADE_PLAN',
      limit,
      used,
      remaining,
    };
  }

  private static async getSmartAlertsEntitlement(userId: string): Promise<SingleEntitlementState> {
    const userObjId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
    if (!userObjId) {
      return EntitlementOrchestrator.createFallbackState('SERVICE_UNAVAILABLE', 'CONTACT_SUPPORT');
    }

    const entitlements = await Entitlement.find({
      userId: userObjId,
      type: 'SMART_ALERT_SLOT',
      status: 'ACTIVE',
      remaining: { $gt: 0 }
    }).lean();

    const totalRemaining = entitlements.reduce(
      (sum, e) => sum + Number(e.remaining ?? 0), 0
    );
    const totalConsumed = entitlements.reduce(
      (sum, e) => sum + Number(e.consumed ?? 0), 0
    );
    const totalQuantity = entitlements.reduce(
      (sum, e) => sum + Number(e.quantity ?? 0), 0
    );

    const allowed = totalRemaining > 0;

    return {
      allowed,
      reason: allowed ? 'OK' : 'QUOTA_EXHAUSTED',
      action: allowed ? 'POST' : 'BUY_AD_PACK',
      limit: totalQuantity,
      used: totalConsumed,
      remaining: totalRemaining,
    };
  }

  private static createFallbackState(
    reason: SingleEntitlementState['reason'],
    action: SingleEntitlementState['action']
  ): SingleEntitlementState {
    return {
      allowed: false,
      reason,
      action,
      limit: 0,
      used: 0,
      remaining: 0,
    };
  }
}
