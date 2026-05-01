import { redirect } from 'next/navigation';
import { buildChatConversationRoute, resolveChatInboxView } from '@/lib/chatUiRoutes';

interface LegacyConversationPageProps {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ returnTo?: string | string[]; view?: string | string[] }>;
}

const getSingleSearchParam = (value?: string | string[]): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export default async function LegacyConversationRedirectPage({
  params,
  searchParams,
}: LegacyConversationPageProps) {
  const { conversationId } = await params;
  const resolvedSearchParams = await searchParams;
  const returnTo = getSingleSearchParam(resolvedSearchParams?.returnTo);
  const view = resolveChatInboxView(resolvedSearchParams?.view);

  redirect(buildChatConversationRoute(conversationId, { returnTo, view }));
}
