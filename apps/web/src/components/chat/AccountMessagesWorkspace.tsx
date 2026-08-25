'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ConversationListView } from '@/lib/api/chatApi';
import { buildChatConversationRoute, buildChatInboxRoute } from '@/lib/chatUiRoutes';
import { ChatList } from './ChatList';
import { ConversationView } from './ConversationView';
import type { IConversationDTO } from "@esparex/contracts";

import { MessageSquare, Sparkles } from '@/icons/IconRegistry';

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
        <div className="hidden md:flex h-full min-h-0 flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
          {/* Sparkle Chat Bubble Illustration */}
          <div className="relative mb-3.5 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <MessageSquare className="h-7 w-7" />
            </div>
            <Sparkles className="absolute -top-1.5 -right-1.5 h-4 w-4 text-amber-500 fill-amber-500/20" />
          </div>

          <h3 className="text-base font-bold text-slate-900">No conversations yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
            Messages with buyers and sellers will appear here.
          </p>

          <Link
            href="/browse"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 h-9 text-xs font-semibold shadow-xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Browse Listings</span>
          </Link>
        </div>
      );
    }

    if (!initialConversation) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center bg-slate-50/50 p-6">
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold text-red-600">Unable to load this conversation right now.</p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
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
    <div className="flex flex-col h-[480px] max-h-[480px] md:h-[480px] md:max-h-[480px] md:min-h-[480px] rounded-none md:rounded-2xl border-0 md:border md:border-border/80 bg-white md:shadow-xs overflow-hidden flex-1 min-h-0">
      <div className="md:grid md:flex-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] overflow-hidden min-h-0 h-full max-h-[480px]">
        <div className={`${conversationId ? 'hidden md:block' : 'block'} border-r border-border/80 bg-white h-full min-h-0 max-h-[480px] overflow-hidden flex flex-col`}>
          <ChatList
            currentUserId={currentUserId}
            view={initialView}
            onViewChange={handleViewChange}
            activeConversationId={conversationId}
            conversationHrefBuilder={(id, view) => buildChatConversationRoute(id, { view })}
          />
        </div>

        <div className={`${conversationId ? 'flex flex-col' : 'hidden md:flex md:flex-col'} h-full bg-white min-h-0 max-h-[480px] overflow-hidden`}>
          {renderConversationPanel()}
        </div>
      </div>
    </div>
  );
}

