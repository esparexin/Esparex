import logger from '@/lib/logger';

export type PlansWalletEventType =
  | 'plans_wallet_dashboard_viewed'
  | 'plans_tab_switched'
  | 'credit_pack_details_viewed'
  | 'plan_purchase_initiated';

export interface PlansWalletTelemetryPayload {
  tabName?: string;
  planId?: string;
  planName?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export function trackPlansWalletEvent(
  eventType: PlansWalletEventType,
  payload: PlansWalletTelemetryPayload = {}
): void {
  try {
    logger.info(`[TELEMETRY] ${eventType}`, {
      eventType,
      ...payload,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Telemetry must never crash application flow
  }
}
