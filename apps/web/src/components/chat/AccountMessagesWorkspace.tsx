'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import type { ConversationListView } from '@/lib/api/chatApi';
import { buildChatConversationRoute, buildChatInboxRoute } from '@/lib/chatUiRoutes';
import { ChatList } from './ChatList';
import { ConversationView } from './ConversationView';
import type { IConversationDTO } from "@esparex/contracts";

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
  initialConversation = undefined,
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
        <div className="hidden md:flex h-full min-h-[580px] items-center justify-center bg-slate-50/60 p-10">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
              💬
            </div>
            <h3 className="text-lg font-bold text-foreground">Select a conversation</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pick a buyer or seller conversation from your inbox to start chatting without leaving your workspace.
            </p>
          </div>
        </div>
      );
    }

    if (!initialConversation) {
      return (
        <div className="flex h-full min-h-[580px] items-center justify-center bg-slate-50/60 p-10">
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold text-red-600">Unable to load this conversation right now.</p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-foreground"
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
    <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm rounded-2xl">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
          <p className="text-xs text-slate-500">
            Real-time chat workspace for buyer & seller inquiries
          </p>
        </div>
      </div>

      <div className="md:grid md:h-[calc(100vh-220px)] md:min-h-[580px] md:grid-cols-[340px_1fr]">
        <div className={`${conversationId ? 'hidden md:block' : 'block'} border-r border-slate-100 overflow-y-auto`}>
          <ChatList
            currentUserId={currentUserId}
            view={initialView}
            onViewChange={handleViewChange}
            activeConversationId={conversationId}
            conversationHrefBuilder={(id, view) => buildChatConversationRoute(id, { view })}
          />
        </div>

        <div className={`${conversationId ? 'block' : 'hidden md:block'} h-full min-h-[580px] bg-white overflow-hidden`}>
          {renderConversationPanel()}
        </div>
      </div>
    </Card>
  );
}

