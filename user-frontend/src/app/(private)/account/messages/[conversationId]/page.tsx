import { fetchServerConversation } from "@/lib/chat/serverConversation";
import { resolveChatInboxView } from "@/lib/chatUiRoutes";
import { AccountPageShell } from "../../_shell/AccountPageShell";

interface AccountConversationPageProps {
  params: Promise<{ conversationId: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}

export default async function AccountConversationPage({
  params,
  searchParams,
}: AccountConversationPageProps) {
  const { conversationId } = await params;
  const resolvedSearchParams = await searchParams;
  const messagesView = resolveChatInboxView(resolvedSearchParams?.view);
  const initialConversation = await fetchServerConversation(conversationId);

  return (
    <AccountPageShell
      tab="messages"
      messagesView={messagesView}
      conversationId={conversationId}
      initialConversation={initialConversation}
    />
  );
}
