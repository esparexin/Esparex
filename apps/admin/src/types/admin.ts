export type { AdminUser } from '@esparex/contracts';

export interface AdminEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
  status?: number;
  path?: string;
}
