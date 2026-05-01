'use client';

export const CHAT_INBOX_UPDATED_EVENT = 'esparex:chat-inbox-updated';

export function dispatchChatInboxUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHAT_INBOX_UPDATED_EVENT));
}
