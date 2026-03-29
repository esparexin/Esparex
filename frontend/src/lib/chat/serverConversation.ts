import { cookies } from 'next/headers';
import { buildUserApiUrl } from '@/lib/api/user/server';
import { USER_ROUTES } from '@/lib/api/routes';
import type { IConversationDTO, IConversationResponse } from '@shared/contracts/chat.contracts';

export async function fetchServerConversation(conversationId: string): Promise<IConversationDTO | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (!cookieHeader) return null;

    const response = await fetch(buildUserApiUrl(USER_ROUTES.CHAT_CONVERSATION(conversationId)), {
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

    const payload = await response.json().catch(() => null) as IConversationResponse | null;
    return payload?.data ?? null;
  } catch {
    return null;
  }
}
