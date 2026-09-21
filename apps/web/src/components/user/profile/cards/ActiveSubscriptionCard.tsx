import React from 'react';
import type { SubscriptionSummaryDTO } from '@esparex/contracts';
import { Crown, Calendar, Clock, CheckCircle2 } from "@esparex/ui";
import { formatPlanName } from '@esparex/shared';

interface ActiveSubscriptionCardProps {
  subscription: SubscriptionSummaryDTO | null;
  nextMonthlyResetDate?: string | null;
  onBrowsePlans?: () => void;
}

export const ActiveSubscriptionCard: React.FC<ActiveSubscriptionCardProps> = ({
  subscription,
  nextMonthlyResetDate,
  onBrowsePlans,
}) => {
  const [currentTime] = React.useState(() => Date.now());

  if (!subscription) {
    return (
      <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
              <Crown className="w-3 h-3 text-primary shrink-0" />
              <span>FREE PLAN</span>
            </div>
            <h3 className="text-body-lg font-bold text-foreground tracking-tight">Free Starter Plan</h3>
            <p className="text-caption text-muted-foreground max-w-lg">
              Monthly plan with free ad postings. Upgrade to unlock extra posting power, spotlight boosts, and instant buyer alerts.
            </p>
            {nextMonthlyResetDate && (
              <div className="flex items-center gap-1.5 text-tiny text-muted-foreground pt-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span>Free monthly quota resets: <strong className="text-foreground">{new Date(nextMonthlyResetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
              </div>
            )}
          </div>
          {onBrowsePlans && (
            <button
              type="button"
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    );
  }

  const isExpired = subscription.status === 'EXPIRED' || Boolean(subscription.endDate && new Date(subscription.endDate).getTime() < currentTime);
  const daysLeft = subscription.daysRemaining ?? (subscription.endDate ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - currentTime) / (1000 * 60 * 60 * 24))) : null);
  const startDateFormatted = subscription.startDate ? new Date(subscription.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const endDateFormatted = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isExpired ? (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                  <Crown className="w-3 h-3 text-primary shrink-0" />
                  <span>FREE PLAN</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Previous Pack Expired</span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                  <Crown className="w-3 h-3 text-primary shrink-0" />
                  <span>{subscription.category || 'Standard'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Active Plan</span>
                </span>
              </>
            )}
            {!isExpired && daysLeft !== null && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-tiny font-semibold ${
                daysLeft <= 5
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  : 'bg-muted/70 text-foreground-secondary border border-border/40'
              }`}>
                <Clock className="w-3 h-3 shrink-0" />
                <span>{daysLeft} days left</span>
              </span>
            )}
          </div>

          <h3 className="text-body-lg sm:text-title font-bold text-foreground tracking-tight">
            {isExpired ? 'Free Starter Plan' : formatPlanName(subscription.planName)}
          </h3>

          {isExpired ? (
            <p className="text-caption text-muted-foreground">
              Previous pack ({formatPlanName(subscription.planName)}) expired{endDateFormatted ? ` on ${endDateFormatted}` : ''}. You are active on the Free tier with monthly quotas.
            </p>
          ) : null}

          {/* Plan Validity Info Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-tiny text-muted-foreground pt-0.5">
            {startDateFormatted && !isExpired && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span>Purchased: <strong className="text-foreground">{startDateFormatted}</strong></span>
              </div>
            )}
            {endDateFormatted && !isExpired ? (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span>Valid until: <strong className="text-foreground">{endDateFormatted}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span>Free monthly quota resets: <strong className="text-foreground">{nextMonthlyResetDate ? new Date(nextMonthlyResetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '1st of every month'}</strong></span>
              </div>
            )}
          </div>
        </div>

        {onBrowsePlans && (
          <button
            type="button"
            onClick={onBrowsePlans}
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
};
