/**
 * Admin Chat API — uses adminFetch (cookie-based admin JWT + CSRF)
 */
import { adminFetch } from './adminClient';

export interface AdminConvSummary {
  id: string;
  buyerName: string;
  sellerName: string;
  adTitle: string;
  lastMessage?: string;
  lastMessageAt?: string;
  isBlocked: boolean;
  isAdClosed: boolean;
  unreadBuyer: number;
  unreadSeller: number;
  updatedAt: string;
}

export interface AdminChatListResponse {
  success: boolean;
  data: AdminConvSummary[];
  total: number;
  page: number;
  limit: number;
}

export type AdminChatFilter = 'all' | 'reported' | 'high_risk' | 'blocked' | 'closed';

export async function fetchAdminChats(params: {
  filter?: AdminChatFilter;
  riskMin?: number;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AdminChatListResponse> {
  const qs = new URLSearchParams();
  if (params.filter) qs.set('filter', params.filter);
  if (params.riskMin !== undefined) qs.set('riskMin', String(params.riskMin));
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  const res = await adminFetch<AdminChatListResponse>(`/chat/admin/list?${qs.toString()}`);
  return res as unknown as AdminChatListResponse;
}

export async function fetchAdminChatDetail(id: string): Promise<unknown> {
  return adminFetch(`/chat/admin/${id}`);
}

export async function adminDeleteChatMessage(msgId: string, reason?: string): Promise<void> {
  await adminFetch(`/chat/admin/message/${msgId}`, {
    method: 'DELETE',
    body: { reason },
  });
}

export async function adminMuteChat(id: string, reason?: string): Promise<void> {
  await adminFetch(`/chat/admin/mute/${id}`, {
    method: 'POST',
    body: { reason },
  });
}

export async function adminExportChat(id: string): Promise<unknown> {
  return adminFetch(`/chat/admin/export/${id}`, { method: 'POST' });
}
