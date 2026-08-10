'use client';

import { formatAppDate } from '@/lib/formatters';

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const label = formatAppDate(date, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: undefined,
  });
  return (
    <div className="date-separator" role="separator" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}
