import React from 'react';
import type { SubscriptionSummaryDTO } from '@esparex/contracts';

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
      <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-2xs font-semibold bg-muted text-muted-foreground mb-1">
              Free Plan
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">Free Starter Plan</h3>
            <p className="text-2xs sm:text-xs text-muted-foreground mt-0.5">
              Monthly plan with free ad postings. Upgrade to unlock extra posting power, spotlight boosts, and instant buyer alerts.
            </p>
          </div>
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
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
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-primary/10 text-primary uppercase tracking-wide">
              {subscription.category || 'Standard'}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                isExpired
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isExpired ? 'Expired' : 'Active Plan'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            {formatPlanName(subscription.planName)}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs sm:text-xs text-muted-foreground mt-1">
            <span>
              30-Day Plan Validity • Resets on 1st of every month
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs whitespace-nowrap cursor-pointer"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
