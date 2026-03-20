/**
 * /chat — Chat inbox page (private route)
 * Lists all conversations for the logged-in user.
 */
import type { Metadata } from 'next';
import { ChatList } from '@/components/chat/ChatList';
import { getServerSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Messages | Esparex',
  description: 'Your conversations with buyers and sellers on Esparex.',
};

export default async function ChatInboxPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/login?next=/chat');
  }

  return (
    <main className="chat-inbox-page">
      <div className="chat-inbox-page__header">
        <h1 className="chat-inbox-page__title">Messages</h1>
      </div>
      <ChatList currentUserId={session.user.id ?? session.user._id?.toString() ?? ''} />
    </main>
  );
}
