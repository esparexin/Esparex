'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        <div className="hidden md:flex h-full min-h-[580px] flex-col items-center justify-center bg-slate-50/50 p-8 text-center">
          {/* Sparkle Chat Bubble Illustration */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50/80 text-4xl">
              💬
            </div>
            <span className="absolute -top-1 -right-1 text-sky-400 text-lg">✨</span>
            <span className="absolute -bottom-1 -left-1 text-sky-300 text-base">✨</span>
          </div>

          <h3 className="text-xl font-bold text-slate-900">No conversations yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
            Messages with buyers and sellers will appear here
          </p>

          <Link
            href="/browse"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-white px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
          >
            <span>💬</span>
            <span>Browse Listings</span>
          </Link>
        </div>
      );
    }

    if (!initialConversation) {
      return (
        <div className="flex h-full min-h-[580px] items-center justify-center bg-slate-50/50 p-8">
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold text-red-600">Unable to load this conversation right now.</p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
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
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[560px] bg-white md:rounded-xl md:border md:border-slate-200/90 md:shadow-sm overflow-hidden">
      {/* Workspace Header (Hidden on Mobile to eliminate duplicate header) */}
      <div className="hidden md:flex border-b border-slate-200/80 px-5 py-3.5 items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Messages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time chat workspace for buyer & seller inquiries
          </p>
        </div>
      </div>

      <div className="md:grid md:flex-1 md:grid-cols-[340px_1fr] overflow-hidden min-h-0">
        <div className={`${conversationId ? 'hidden md:block' : 'block'} border-r border-slate-200/80 overflow-y-auto bg-white`}>
          <ChatList
            currentUserId={currentUserId}
            view={initialView}
            onViewChange={handleViewChange}
            activeConversationId={conversationId}
            conversationHrefBuilder={(id, view) => buildChatConversationRoute(id, { view })}
          />
        </div>

        <div className={`${conversationId ? 'block' : 'hidden md:block'} h-full bg-white overflow-hidden`}>
          {renderConversationPanel()}
        </div>
      </div>
    </div>
  );
}

