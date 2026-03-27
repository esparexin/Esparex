/**
 * /chat/[conversationId] — Individual conversation page (private route)
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ConversationView } from '@/components/chat/ConversationView';
import { getServerSession } from '@/lib/auth/session';
import { buildLoginUrl } from '@/lib/authHelpers';
import { buildUserApiUrl } from '@/lib/api/user/server';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

export const metadata: Metadata = {
  title: 'Chat | Esparex',
};

interface Props {
  params: Promise<{ conversationId: string }>;
}

async function fetchConversation(id: string): Promise<IConversationDTO | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (!cookieHeader) return null;

    const response = await fetch(buildUserApiUrl('chat/list'), {
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

    const payload = await response.json().catch(() => null) as { data?: IConversationDTO[] } | null;
    const conversations = Array.isArray(payload?.data) ? payload.data : [];
    return conversations.find((c) => c.id === id) ?? null;
  } catch {
    return null;
  }
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const session = await getServerSession();
  if (!session?.user) {
    redirect(buildLoginUrl(`/chat/${conversationId}`));
  }

  const conversation = await fetchConversation(conversationId);
  if (!conversation) notFound();

  const userId = session.user.id ?? session.user._id?.toString() ?? '';

  // IDOR guard — ensure the logged-in user is a participant
  const isMember =
    conversation.buyer.id === userId || conversation.seller.id === userId;
  if (!isMember) notFound();

  return (
    <ConversationView
      conversation={conversation}
      currentUserId={userId}
    />
  );
}
