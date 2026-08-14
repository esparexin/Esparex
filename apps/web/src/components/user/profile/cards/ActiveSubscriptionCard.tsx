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
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
              <Crown className="w-3 h-3 text-blue-600 shrink-0" />
              <span>FREE PLAN</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Free Starter Plan</h3>
            <p className="text-xs text-slate-500 max-w-lg">
              Monthly plan with free ad postings. Upgrade to unlock extra posting power, spotlight boosts, and instant buyer alerts.
            </p>
          </div>
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
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
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
              <Crown className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{subscription.category || 'Standard'}</span>
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                isExpired ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isExpired ? 'Expired' : 'Active Plan'}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {formatPlanName(subscription.planName)}
          </h3>

          <p className="text-xs text-slate-500">
            {isExpired ? 'Plan has expired. Renew to continue posting.' : '30-Day Plan Validity • Resets on 1st of every month'}
          </p>
        </div>

        {onBrowsePlans && (
          <button
            onClick={onBrowsePlans}
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
};
