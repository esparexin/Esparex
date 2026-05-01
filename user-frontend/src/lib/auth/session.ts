import { cookies } from 'next/headers';
import {
  API_ROUTES,
  API_V1_BASE_PATH,
  DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

type SessionUser = {
  id: string;
  _id?: string;
};

export type ServerSession = {
  user: SessionUser;
};

type UsersMePayload = {
  data?: unknown;
  user?: unknown;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`
).replace(/\/$/, '');

function extractUserId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const idValue = record.id ?? record._id;
  return typeof idValue === 'string' && idValue.length > 0 ? idValue : null;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('esparex_auth');
  if (!authCookie) return null;

  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) return null;

  try {
    const response = await fetch(`${API_BASE}/${API_ROUTES.USER.USERS_ME}`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as UsersMePayload;
    const userCandidate =
      payload && typeof payload === 'object' && payload.data ? payload.data : payload?.user;
    const id = extractUserId(userCandidate);
    if (!id) return null;

    return { user: { id, _id: id } };
  } catch {
    return null;
  }
}
