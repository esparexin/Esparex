import React from 'react';
import type { WalletSummaryDTO, CreditPackDTO } from '@esparex/contracts';
import { Package, Bell, Card, CardContent, ArrowRight, Clock } from '@esparex/ui';

export interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
  creditPacks?: CreditPackDTO[];
  onNavigateToHistory?: (filterType?: string) => void;
}

/** Returns the nearest expiry date string among active purchased packs of a given type, or null. */
function nearestExpiry(
  packs: CreditPackDTO[],
  type: CreditPackDTO['entitlementType'] | CreditPackDTO['entitlementType'][],
): string | null {
  const types = Array.isArray(type) ? type : [type];
  const active = (packs ?? []).filter(
    (p): p is CreditPackDTO & { expiresAt: string } =>
      types.includes(p.entitlementType) &&
      p.status === 'ACTIVE' &&
      p.remaining > 0 &&
      Boolean(p.expiresAt),
  );
  if (!active.length) return null;
  active.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  const first = active[0];
  return first
    ? new Date(first.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  badge: React.ReactNode;
  details: React.ReactNode;
  expiry?: string | null;
  onExpiryClick?: () => void;
}

const StatRow: React.FC<StatRowProps> = ({ icon, label, description, badge, details, expiry, onExpiryClick }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3.5">
    {/* Left: icon + label */}
    <div className="flex items-center gap-3 sm:w-44 shrink-0">
      {icon}
      <div className="min-w-0">
        <div className="text-small font-bold text-foreground leading-tight">{label}</div>
        <div className="text-tiny text-muted-foreground leading-tight">{description}</div>
      </div>
    </div>

    {/* Right: details + expiry + badge */}
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-tiny text-muted-foreground pl-11 sm:pl-0 flex-1 justify-end">
      {details}
      {expiry && (
        <button
          type="button"
          onClick={onExpiryClick}
          className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline cursor-pointer focus-visible:outline-none"
        >
          <Clock className="w-3 h-3 shrink-0" />
          Expires {expiry}
        </button>
      )}
      {badge}
    </div>
  </div>
);

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({
  wallet,
  creditPacks = [],
  onNavigateToHistory,
}) => {
  const freeAdsRemaining = wallet.monthlyFreeAdsRemaining ?? 0;
  const freeAdsTotal = wallet.monthlyFreeAdsTotal ?? 0;
  const paidAds = wallet.paidAdCredits ?? 0;
  const totalAdCredits = freeAdsRemaining + paidAds;

  const freeAlerts = wallet.freeAlertSlotsBase ?? 2;
  const extraAlerts = wallet.paidAlertSlots ?? Math.max(0, (wallet.smartAlertSlots ?? 0) - freeAlerts);
  const totalAlertSlots = freeAlerts + extraAlerts;

  const resetDateFormatted = wallet.nextMonthlyResetDate
    ? new Date(wallet.nextMonthlyResetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const adExpiry = paidAds > 0 ? nearestExpiry(creditPacks, 'AD_POSTING') : null;
  const alertExpiry = extraAlerts > 0 ? nearestExpiry(creditPacks, 'SMART_ALERT_SLOT') : null;

  const pillCls = (color: 'primary' | 'emerald') => {
    const map = {
      primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 focus-visible:ring-primary',
      emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 focus-visible:ring-emerald-500',
    };
    return `text-tiny font-semibold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 shrink-0 ${map[color]}`;
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-xs">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider">Available Balances</h4>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={() => onNavigateToHistory()}
              className="text-tiny font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
            >
              View My Usage <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/40">
          {/* Row 1 — Free Ads */}
          <StatRow
            icon={
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Package className="w-4 h-4" />
              </div>
            }
            label="Free Ads"
            description="Monthly quota to publish listings"
            badge={
              <button
                type="button"
                onClick={() => onNavigateToHistory?.('MORE_ADS')}
                className={pillCls('primary')}
                title="View ad posting credit usage"
              >
                {totalAdCredits} Available
              </button>
            }
            details={
              <>
                <span>Free Monthly: <strong className="text-foreground">{freeAdsRemaining}</strong><span className="text-muted-foreground/60"> / {freeAdsTotal}</span></span>
                {paidAds > 0 && <span>Extra Paid: <strong className="text-foreground">{paidAds}</strong></span>}
              </>
            }
            expiry={adExpiry}
            onExpiryClick={() => onNavigateToHistory?.('MORE_ADS')}
          />

          {/* Row 2 — Smart Alerts */}
          <StatRow
            icon={
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
            }
            label="Smart Alerts"
            description="Get notified when buyers search your keywords"
            badge={
              <button
                type="button"
                onClick={() => onNavigateToHistory?.('SMART_ALERTS')}
                className={pillCls('emerald')}
                title="View smart alert usage"
              >
                {totalAlertSlots} Active
              </button>
            }
            details={
              <>
                <span>Free Monthly: <strong className="text-foreground">{freeAlerts}</strong></span>
                {extraAlerts > 0 && <span>Extra Purchased: <strong className="text-foreground">{extraAlerts}</strong></span>}
              </>
            }
            expiry={alertExpiry}
            onExpiryClick={() => onNavigateToHistory?.('SMART_ALERTS')}
          />
        </div>

        {/* Footer — monthly reset */}
        {resetDateFormatted && (
          <p className="text-tiny text-muted-foreground pt-3 border-t border-border/40 mt-1">
            Free Monthly quota resets: <strong className="text-foreground">{resetDateFormatted}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
