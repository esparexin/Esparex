/**
 * /chat/[conversationId] — Individual conversation page (private route)
 */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ConversationView } from '@/components/chat/ConversationView';
import { getServerSession } from '@/lib/auth/session';
import { apiClient } from '@/lib/api/client';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

export const metadata: Metadata = {
  title: 'Chat | Esparex',
};

interface Props {
  params: { conversationId: string };
}

async function fetchConversation(id: string): Promise<IConversationDTO | null> {
  try {
    const res = await apiClient.get<{ success: boolean; data: IConversationDTO[] }>(
      `chat/list`
    );
    return (res.data ?? []).find((c) => c.id === id) ?? null;
  } catch {
    return null;
  }
}

export default async function ConversationPage({ params }: Props) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect(`/auth/login?next=/chat/${params.conversationId}`);
  }

  const conversation = await fetchConversation(params.conversationId);
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
