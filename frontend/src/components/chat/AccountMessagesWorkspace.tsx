'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import type { ConversationListView } from '@/lib/api/chatApi';
import { buildChatConversationRoute, buildChatInboxRoute } from '@/lib/chatUiRoutes';
import { ChatList } from './ChatList';
import { ConversationView } from './ConversationView';
import type { IConversationDTO } from '@shared/contracts/chat.contracts';

interface AccountMessagesWorkspaceProps {
  currentUserId: string;
  conversationId?: string;
  initialView?: ConversationListView;
  initialConversation?: IConversationDTO | null;
}

export function AccountMessagesWorkspace({
  currentUserId,
  conversationId,
  initialView = 'active',
  initialConversation = null,
}: AccountMessagesWorkspaceProps) {
  const router = useRouter();

  const handleViewChange = (view: ConversationListView) => {
    const targetRoute = conversationId
      ? buildChatConversationRoute(conversationId, { view })
      : buildChatInboxRoute(view);
    void router.push(targetRoute);
  };

  const renderConversationPanel = () => {
    if (!conversationId) {
      return (
        <div className="hidden md:flex min-h-[680px] items-center justify-center bg-slate-50/70 p-10">
          <div className="max-w-sm text-center">
            <h3 className="text-lg font-bold text-foreground">Select a conversation</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pick a buyer or seller conversation from the inbox to keep chatting without leaving your account area.
            </p>
          </div>
        </div>
      );
    }

    if (!initialConversation) {
      return (
        <div className="flex min-h-[680px] items-center justify-center bg-slate-50/70 p-10">
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold text-red-600">Unable to load this conversation right now.</p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-foreground-secondary"
              onClick={() => {
                router.refresh();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <ConversationView
        conversation={initialConversation}
        currentUserId={currentUserId}
        embedded
      />
    );
  };

  return (
    <Card className="overflow-hidden border-0 bg-white/80 shadow-sm backdrop-blur">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-bold text-foreground">Messages</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue conversations with buyers and sellers without leaving your account area.
        </p>
      </div>

      <div className="md:grid md:min-h-[680px] md:grid-cols-[360px_minmax(0,1fr)]">
        <div className={`${conversationId ? 'hidden md:block' : 'block'} border-r border-slate-100`}>
          <ChatList
            currentUserId={currentUserId}
            view={initialView}
            onViewChange={handleViewChange}
            activeConversationId={conversationId}
            conversationHrefBuilder={(id, view) => buildChatConversationRoute(id, { view })}
          />
        </div>

        <div className={`${conversationId ? 'block' : 'hidden md:block'} min-h-[680px] bg-white`}>
          {renderConversationPanel()}
        </div>
      </div>
    </Card>
  );
}
