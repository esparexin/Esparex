import type { CreditPackDTO } from '@esparex/contracts';
import { AlertCircle, CheckCircle2, Clock } from '@esparex/ui';

export const isPackExpired = (p: CreditPackDTO): boolean =>
  p.status === 'EXPIRED' ||
  Boolean(p.expiresAt && new Date(p.expiresAt).getTime() <= Date.now());

export const getCreditPackStatusBadge = (p: CreditPackDTO) => {
  if (isPackExpired(p)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="w-3 h-3 shrink-0" /> Expired
      </span>
    );
  }
  if (p.remaining === 0 || p.status === 'EXHAUSTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-muted text-muted-foreground border border-border/40">
        <CheckCircle2 className="w-3 h-3 shrink-0" /> Fully Used
      </span>
    );
  }
  const daysLeft = p.expiresAt
    ? Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  if (daysLeft !== null && daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock className="w-3 h-3 shrink-0" /> {daysLeft}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-3 h-3 shrink-0" /> Active
    </span>
  );
};

export const getValidityDisplay = (p: CreditPackDTO) => {
  if (!p.expiresAt) return 'Standard Validity';
  const dateStr = new Date(p.expiresAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (isPackExpired(p)) return `Expired on: ${dateStr}`;
  const daysLeft = Math.max(0, Math.ceil((new Date(p.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  return `Valid until: ${dateStr} (${daysLeft}d left)`;
};
