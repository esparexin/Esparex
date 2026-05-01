import { redirect } from 'next/navigation';
import { buildChatInboxRoute, resolveChatInboxView } from '@/lib/chatUiRoutes';

interface LegacyChatInboxRedirectPageProps {
  searchParams?: Promise<{ view?: string | string[] }>;
}

export default async function LegacyChatInboxRedirectPage({
  searchParams,
}: LegacyChatInboxRedirectPageProps) {
  const resolvedSearchParams = await searchParams;
  const view = resolveChatInboxView(resolvedSearchParams?.view);

  redirect(buildChatInboxRoute(view));
}
