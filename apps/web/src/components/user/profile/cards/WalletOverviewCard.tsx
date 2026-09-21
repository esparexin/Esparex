import React from 'react';
import type { WalletSummaryDTO, CreditPackDTO } from '@esparex/contracts';
import {
  Package,
  Bell,
  Sparkles,
  TrendingUp,
  Card,
  CardContent,
  ArrowRight,
  Clock,
} from '@esparex/ui';

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

interface StatTileProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  value: number | string;
  unit: string;
  expiry?: string | null;
  onClick?: () => void;
  ariaLabel: string;
}

const StatTile: React.FC<StatTileProps> = ({
  icon,
  iconBgClass,
  label,
  value,
  unit,
  expiry,
  onClick,
  ariaLabel,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    aria-label={ariaLabel}
    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-border bg-card text-left transition-all ${
      onClick
        ? 'hover:border-primary/40 hover:bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        : 'cursor-default'
    }`}
  >
    <div className="flex items-center justify-between gap-2 w-full mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${iconBgClass}`}>
          {icon}
        </div>
        <span className="text-small font-bold text-foreground truncate">{label}</span>
      </div>
      {onClick && (
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
      )}
    </div>

    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 w-full mt-auto">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</span>
        <span className="text-caption font-medium text-muted-foreground">{` ${unit}`}</span>
      </div>
      {expiry && (
        <span className="inline-flex items-center gap-1 text-tiny text-amber-600 dark:text-amber-400 font-medium">
          <Clock className="w-3 h-3 shrink-0" />
          Expires {expiry}
        </span>
      )}
    </div>
  </button>
);

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({
  wallet,
  creditPacks = [],
  onNavigateToHistory,
}) => {
  const freeAdsRemaining = wallet.monthlyFreeAdsRemaining ?? 0;
  const paidAds = wallet.paidAdCredits ?? 0;

  const freeAlerts = wallet.freeAlertSlotsBase ?? 2;
  const extraAlerts = wallet.paidAlertSlots ?? Math.max(0, (wallet.smartAlertSlots ?? 0) - freeAlerts);

  const resetDateFormatted = wallet.nextMonthlyResetDate
    ? new Date(wallet.nextMonthlyResetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const adExpiry = paidAds > 0 ? nearestExpiry(creditPacks, 'AD_POSTING') : null;
  const alertExpiry = extraAlerts > 0 ? nearestExpiry(creditPacks, 'SMART_ALERT_SLOT') : null;
  const spotlightExpiry = (wallet.spotlightCredits ?? 0) > 0 ? nearestExpiry(creditPacks, ['SPOTLIGHT_HP', 'SPOTLIGHT_CAT']) : null;
  const topAdExpiry = (wallet.topAdCredits ?? 0) > 0 ? nearestExpiry(creditPacks, 'PUSH_TO_TOP') : null;

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-xs">
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-body font-bold text-foreground">Available Balances</h3>
            {resetDateFormatted && (
              <p className="text-tiny text-muted-foreground mt-0.5">
                Free allowances reset on <strong className="text-foreground">{resetDateFormatted}</strong>
              </p>
            )}
          </div>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={() => onNavigateToHistory()}
              className="text-tiny font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1"
            >
              View My Usage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section 1: Free Allowances */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
              Free Allowances
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatTile
              icon={<Package className="w-4 h-4" />}
              iconBgClass="bg-primary/10 text-primary border border-primary/20"
              label="Free Ads"
              value={freeAdsRemaining}
              unit="Available"
              ariaLabel={`Free Ads: ${freeAdsRemaining} Available`}
              onClick={() => onNavigateToHistory?.('MORE_ADS')}
            />
            <StatTile
              icon={<Bell className="w-4 h-4" />}
              iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              label="Smart Alerts"
              value={freeAlerts}
              unit="Active"
              ariaLabel={`Free Smart Alerts: ${freeAlerts} Active`}
              onClick={() => onNavigateToHistory?.('SMART_ALERTS')}
            />
          </div>
        </div>

        {/* Section 2: Purchased Credits */}
        <div className="space-y-2.5 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
              Purchased Credits
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              icon={<Sparkles className="w-4 h-4" />}
              iconBgClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              label="Spotlight"
              value={wallet.spotlightCredits ?? 0}
              unit="Credits"
              expiry={spotlightExpiry}
              ariaLabel={`Spotlight: ${wallet.spotlightCredits ?? 0} Credits`}
              onClick={() => onNavigateToHistory?.('SPOTLIGHT')}
            />
            <StatTile
              icon={<TrendingUp className="w-4 h-4" />}
              iconBgClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
              label="Top Ad"
              value={wallet.topAdCredits ?? 0}
              unit="Credits"
              expiry={topAdExpiry}
              ariaLabel={`Top Ad: ${wallet.topAdCredits ?? 0} Credits`}
              onClick={() => onNavigateToHistory?.('TOP_AD')}
            />
            <StatTile
              icon={<Package className="w-4 h-4" />}
              iconBgClass="bg-primary/10 text-primary border border-primary/20"
              label="More Ads"
              value={paidAds}
              unit="Credits"
              expiry={adExpiry}
              ariaLabel={`More Ads: ${paidAds} Credits`}
              onClick={() => onNavigateToHistory?.('MORE_ADS')}
            />
            <StatTile
              icon={<Bell className="w-4 h-4" />}
              iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              label="Smart Alerts"
              value={extraAlerts}
              unit="Active"
              expiry={alertExpiry}
              ariaLabel={`Purchased Smart Alerts: ${extraAlerts} Active`}
              onClick={() => onNavigateToHistory?.('SMART_ALERTS')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
