'use client';

interface ChatReadOnlyProps {
  reason?: 'sold' | 'expired' | 'blocked' | 'admin';
}

const REASONS: Record<string, string> = {
  sold: '🏷️ Item sold — this chat is now closed.',
  expired: '⏰ This ad has expired — chat is read-only.',
  blocked: '🚫 This chat has been restricted.',
  admin: '🛡️ This conversation has been closed by Esparex support.',
};

export function ChatReadOnly({ reason = 'sold' }: ChatReadOnlyProps) {
  return (
    <div className="chat-readonly">
      <span className="chat-readonly__icon" aria-hidden>🔒</span>
      <p className="chat-readonly__text">{REASONS[reason] ?? REASONS.sold}</p>
    </div>
  );
}
