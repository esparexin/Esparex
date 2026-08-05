'use client';

import * as React from 'react';
import { cn } from '@esparex/ui';

export interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'bordered';
}

/**
 * Standardized Section Primitive (Phase 2 UI/UX Foundation)
 * Enforces 18px section titles, 13-14px subtitles, 8-point grid spacing,
 * and eliminates nested card box wrappers.
 */
export function PageSection({
  title,
  subtitle,
  action,
  children,
  variant = 'default',
  className,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn(
        'space-y-4',
        variant === 'bordered' && 'border border-border rounded-xl p-4 md:p-6 bg-card',
        variant === 'flat' && 'bg-card p-4 md:p-6 rounded-xl',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <div>
            {title && (
              typeof title === 'string' || typeof title === 'number' ? (
                <h3 className="text-lg font-semibold leading-7 text-foreground">{title}</h3>
              ) : (
                <div className="text-lg font-semibold leading-7 text-foreground">{title}</div>
              )
            )}
            {subtitle && <p className="text-xs md:text-sm text-foreground-secondary mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
  clickable?: boolean;
}

/**
 * Flat List Row Primitive
 * Replaces heavy card containers with clean, border-bottom list rows.
 */
export function ListRow({ children, active, clickable, className, ...props }: ListRowProps) {
  return (
    <div
      className={cn(
        'border-b border-border py-3.5 px-4 transition-colors',
        clickable && 'cursor-pointer hover:bg-muted/80',
        active && 'bg-accent/60 border-l-4 border-l-primary',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
