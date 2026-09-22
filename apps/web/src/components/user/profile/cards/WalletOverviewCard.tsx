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
    ? new Date(first.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : null;
}

interface StatTileProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  value: number | string;
  unit: string;
  subtext?: string;
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
  subtext,
  expiry,
  onClick,
  ariaLabel,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={ariaLabel}
      className={`group relative flex flex-col justify-between p-3 sm:p-4 rounded-xl border border-border bg-card text-left transition-all ${
        isClickable
          ? 'hover:border-primary/40 hover:bg-muted/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          : 'cursor-default select-none'
      }`}
    >
      <div className="flex items-center justify-between gap-2 w-full mb-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${iconBgClass}`}>
            {icon}
          </div>
          <span className="text-small sm:text-body font-semibold text-foreground truncate">{label}</span>
        </div>
        {isClickable && (
          <ArrowRight className="hidden sm:block w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        )}
      </div>

      <div className="flex flex-col gap-1 w-full mt-auto">
        <div className="flex items-baseline gap-1.5">
          <span className="text-h3 sm:text-h2 font-bold text-foreground tracking-tight">{value}</span>
          <span className="text-caption font-medium text-muted-foreground">{` ${unit}`}</span>
        </div>
        {subtext && (
          <p className="text-tiny font-medium text-muted-foreground">
            {subtext}
          </p>
        )}
        {expiry && (
          <span className="inline-flex items-center gap-1 text-tiny text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            <Clock className="w-3 h-3 shrink-0" />
            Expires {expiry}
          </span>
        )}
      </div>
    </div>
  );
};

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({
  wallet,
  creditPacks = [],
  onNavigateToHistory,
}) => {
  const freeAdsTotal = wallet.monthlyFreeAdsTotal ?? 5;
  const freeAdsUsed = wallet.monthlyFreeAdsUsed ?? 0;
  const freeAdsRemaining = wallet.monthlyFreeAdsRemaining ?? Math.max(0, freeAdsTotal - freeAdsUsed);
  const paidAds = wallet.paidAdCredits ?? 0;

  const freeAlerts = wallet.freeAlertSlotsBase ?? 2;
  const extraAlerts = wallet.paidAlertSlots ?? Math.max(0, (wallet.smartAlertSlots ?? 0) - freeAlerts);

  const adExpiry = paidAds > 0 ? nearestExpiry(creditPacks, 'AD_POSTING') : null;
  const alertExpiry = extraAlerts > 0 ? nearestExpiry(creditPacks, 'SMART_ALERT_SLOT') : null;
  const spotlightExpiry = (wallet.spotlightCredits ?? 0) > 0 ? nearestExpiry(creditPacks, ['SPOTLIGHT_HP', 'SPOTLIGHT_CAT']) : null;
  const topAdExpiry = (wallet.topAdCredits ?? 0) > 0 ? nearestExpiry(creditPacks, 'PUSH_TO_TOP') : null;

  const hasFreeAdsUsage = freeAdsUsed > 0;

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-body-lg sm:text-h4 font-semibold text-foreground">Available Credits</h3>
          </div>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={() => onNavigateToHistory()}
              className="text-caption font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1"
            >
              View My Usage <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section 1: Free Plans */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Free Plans
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <StatTile
              icon={<Package className="w-4 h-4" />}
              iconBgClass="bg-primary/10 text-primary border border-primary/20"
              label="Free Ads"
              value={freeAdsRemaining}
              unit="Available"
              subtext={`${freeAdsUsed} Used • ${freeAdsTotal} Total / mo`}
              ariaLabel={`Free Ads: ${freeAdsRemaining} Available, ${freeAdsUsed} Used of ${freeAdsTotal} Monthly Quota`}
              onClick={hasFreeAdsUsage ? () => onNavigateToHistory?.('MORE_ADS') : undefined}
            />
            <StatTile
              icon={<Bell className="w-4 h-4" />}
              iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              label="Smart Alerts"
              value={freeAlerts}
              unit="Active"
              subtext={`0 Used • ${freeAlerts} Base Allowance`}
              ariaLabel={`Free Smart Alerts: ${freeAlerts} Active, 0 Used`}
              onClick={undefined}
            />
          </div>
        </div>

        {/* Section 2: Purchased Credits */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
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
              onClick={(wallet.spotlightCredits ?? 0) > 0 ? () => onNavigateToHistory?.('SPOTLIGHT') : undefined}
            />
            <StatTile
              icon={<TrendingUp className="w-4 h-4" />}
              iconBgClass="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
              label="Top Ad"
              value={wallet.topAdCredits ?? 0}
              unit="Credits"
              expiry={topAdExpiry}
              ariaLabel={`Top Ad: ${wallet.topAdCredits ?? 0} Credits`}
              onClick={(wallet.topAdCredits ?? 0) > 0 ? () => onNavigateToHistory?.('TOP_AD') : undefined}
            />
            <StatTile
              icon={<Package className="w-4 h-4" />}
              iconBgClass="bg-primary/10 text-primary border border-primary/20"
              label="More Ads"
              value={paidAds}
              unit="Credits"
              expiry={adExpiry}
              ariaLabel={`More Ads: ${paidAds} Credits`}
              onClick={paidAds > 0 ? () => onNavigateToHistory?.('MORE_ADS') : undefined}
            />
            <StatTile
              icon={<Bell className="w-4 h-4" />}
              iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              label="Smart Alerts"
              value={extraAlerts}
              unit="Active"
              expiry={alertExpiry}
              ariaLabel={`Purchased Smart Alerts: ${extraAlerts} Active`}
              onClick={extraAlerts > 0 ? () => onNavigateToHistory?.('SMART_ALERTS') : undefined}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
