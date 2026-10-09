/**
 * Admin Chat API — uses adminFetch (cookie-based admin JWT + CSRF)
 *
 * Phase 3a (§5): the local `AdminConvSummary` / `AdminChatListResponse`
 * interfaces are relocated to `@esparex/contracts` (canonical owner per
 * DECISION-GATE §3) and re-exported here so existing importers keep working.
 * Deletion of these shims is Phase 4 (§10).
 */
import { adminFetch } from './adminClient';
import type { AdminConvSummary, AdminChatListResponse } from '@esparex/contracts';

export type { AdminConvSummary, AdminChatListResponse };

export type AdminChatFilter = 'all' | 'reported' | 'high_risk' | 'blocked' | 'closed';

export async function fetchAdminChats(params: {
  filter?: AdminChatFilter;
  riskMin?: number;
  page?: number;
  limit?: number;
  q?: string;
}): Promise<AdminChatListResponse> {
  const qs = new URLSearchParams();
  if (params.filter) qs.set('filter', params.filter);
  if (params.riskMin !== undefined) qs.set('riskMin', String(params.riskMin));
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.q) qs.set('q', params.q);
  const res = await adminFetch<AdminChatListResponse>(`/chat/list?${qs.toString()}`);
  const rawRes: unknown = res;
  return rawRes as AdminChatListResponse;
}

export async function adminMuteChat(id: string, reason?: string): Promise<void> {
  await adminFetch(`/chat/mute/${id}`, {
    method: 'POST',
    body: { reason },
  });
}

export async function adminExportChat(id: string): Promise<unknown> {
  return adminFetch(`/chat/export/${id}`, { method: 'POST' });
}
