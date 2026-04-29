import { resolveChatInboxView } from "@/lib/chatUiRoutes";
import { AccountPageShell } from "../_shell/AccountPageShell";

interface AccountMessagesPageProps {
  searchParams?: Promise<{ view?: string | string[] }>;
}

export default async function AccountMessagesPage({ searchParams }: AccountMessagesPageProps) {
  const resolvedSearchParams = await searchParams;
  const messagesView = resolveChatInboxView(resolvedSearchParams?.view);

  return <AccountPageShell tab="messages" messagesView={messagesView} />;
}
