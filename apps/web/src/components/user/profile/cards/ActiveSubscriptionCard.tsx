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
      <div className="bg-card rounded-2xl p-5 border border-border shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
              <Crown className="w-3 h-3 text-primary shrink-0" />
              <span>FREE PLAN</span>
            </div>
            <h3 className="text-body-lg font-bold text-foreground tracking-tight">Free Starter Plan</h3>
            <p className="text-caption text-muted-foreground max-w-lg">
              Monthly plan with free ad postings. Upgrade to unlock extra posting power, spotlight boosts, and instant buyer alerts.
            </p>
          </div>
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
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
    <div className="bg-card rounded-2xl p-5 border border-border shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
              <Crown className="w-3 h-3 text-primary shrink-0" />
              <span>{subscription.category || 'Standard'}</span>
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-tiny font-semibold ${
                isExpired ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isExpired ? 'Expired' : 'Active Plan'}
            </span>
          </div>

          <h3 className="text-body-lg font-bold text-foreground tracking-tight">
            {formatPlanName(subscription.planName)}
          </h3>

          <p className="text-caption text-muted-foreground">
            {isExpired ? 'Plan has expired. Renew to continue posting.' : '30-Day Plan Validity • Resets on 1st of every month'}
          </p>
        </div>

        {onBrowsePlans && (
          <button
            onClick={onBrowsePlans}
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
};
