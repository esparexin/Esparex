import React from 'react';
import type { SubscriptionSummaryDTO } from '@esparex/contracts';
import { Crown } from '@/icons/IconRegistry';

interface ActiveSubscriptionCardProps {
  subscription: SubscriptionSummaryDTO | null;
  onBrowsePlans?: () => void;
}

const formatPlanName = (name?: string) => {
  if (!name) return 'Free Starter Plan';
  if (name.includes('New_user_Plan') || name.toLowerCase().includes('free')) return 'Free Starter Plan';
  return name.replace(/_/g, ' ');
};

export const ActiveSubscriptionCard: React.FC<ActiveSubscriptionCardProps> = ({
  subscription,
  onBrowsePlans,
}) => {
  if (!subscription) {
    return (
      <div className="bg-gradient-to-br from-surface via-surface to-primary/5 rounded-2xl p-4 sm:p-5 border border-primary/20 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-primary/10 text-primary uppercase tracking-wide">
              <Crown className="w-3 h-3 text-primary shrink-0" />
              <span>FREE PLAN</span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">Free Starter Plan</h3>
            <p className="text-2xs sm:text-xs text-muted-foreground max-w-lg">
              Monthly plan with free ad postings. Upgrade to unlock extra posting power, spotlight boosts, and instant buyer alerts.
            </p>
          </div>
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary via-emerald-600 to-teal-600 text-white text-xs font-extrabold hover:opacity-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-md shadow-primary/20 hover:-translate-y-0.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    );
  }

  const isExpired = subscription.status === 'EXPIRED';

  return (
    <div className="bg-gradient-to-br from-surface via-surface to-primary/5 rounded-2xl p-4 sm:p-5 border border-primary/20 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-primary/10 text-primary uppercase tracking-wide">
              <Crown className="w-3 h-3 text-primary shrink-0" />
              <span>{subscription.category || 'Standard'}</span>
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                isExpired
                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-destructive' : 'bg-emerald-500 animate-pulse'} mr-1.5`} />
              {isExpired ? 'Expired' : 'Active Plan'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
            {formatPlanName(subscription.planName)}
          </h3>

          <div className="text-2xs sm:text-xs text-muted-foreground">
            30-Day Plan Validity • Resets on 1st of every month
          </div>
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary via-emerald-600 to-teal-600 text-white text-xs font-extrabold hover:opacity-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-md shadow-primary/20 hover:-translate-y-0.5 whitespace-nowrap cursor-pointer"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
