import React from 'react';
import { Tag } from 'lucide-react';

export interface PromotionalBannerProps {
  title: string;
  description: string;
  badgeText?: string;
  actionText?: string;
  actionHref?: string;
  className?: string;
}

export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  title,
  description,
  badgeText = 'SPECIAL OFFER',
  actionText = 'View Plans',
  actionHref = '/account/plans',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 p-5 shadow-sm transition-all dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/30 ${className}`}
      role="region"
      aria-label="Promotional Announcement"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
            <Tag className="h-3 w-3" />
            <span>{badgeText}</span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl">
            {description}
          </p>
        </div>

        {actionHref && (
          <a
            href={actionHref}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 px-4 text-xs font-bold text-white shadow hover:bg-amber-700 transition-colors dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {actionText}
          </a>
        )}
      </div>
    </div>
  );
};
