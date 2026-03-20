'use client';

import type { IMessageDTO } from '@shared/contracts/chat.contracts';

interface MessageBubbleProps {
  message: IMessageDTO;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  if (message.isSystemMessage) {
    return (
      <div className="chat-system-msg">
        <span>⚠️ {message.text}</span>
      </div>
    );
  }

  return (
    <div className={`chat-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
      <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}`}>
        <p className="chat-bubble__text">{message.text}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="chat-bubble__attachments">
            {message.attachments.map((att, i) => (
              att.mimeType.startsWith('image/') ? (
                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={att.url} alt="attachment" className="chat-bubble__img" />
                </a>
              ) : (
                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="chat-bubble__file">
                  📎 File
                </a>
              )
            ))}
          </div>
        )}
        <span className="chat-bubble__time">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
