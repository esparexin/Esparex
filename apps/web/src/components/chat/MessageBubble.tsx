'use client';

import { useState } from 'react';
import type { ChatAttachment, IMessageDTO } from "@esparex/contracts";
import { ChatImageLightbox } from './ChatImageLightbox';
import { formatAppTime } from '@/lib/formatters';

interface MessageBubbleProps {
  message: IMessageDTO;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  return formatAppTime(iso);
}

function isImageAttachment(attachment: ChatAttachment): boolean {
  return attachment.mimeType.toLowerCase().startsWith('image/');
}

function formatFileSize(bytes?: number): string | null {
  if (!bytes || Number.isNaN(bytes)) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAttachmentKindLabel(attachment: ChatAttachment): string {
  if (attachment.mimeType === 'application/pdf') return 'PDF';
  if (attachment.mimeType.toLowerCase().startsWith('video/')) return 'Video';
  return 'Attachment';
}

function buildAttachmentIcon(attachment: ChatAttachment): string {
  if (attachment.mimeType === 'application/pdf') return '📄';
  if (attachment.mimeType.toLowerCase().startsWith('video/')) return '🎞️';
  return '📎';
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (message.isSystemMessage) {
    return (
      <div className="chat-system-msg">
        <span>⚠️ {message.text}</span>
      </div>
    );
  }

  const attachments = message.attachments ?? [];
  const imageAttachments = attachments.filter(isImageAttachment);
  const fileAttachments = attachments.filter((attachment) => !isImageAttachment(attachment));
  const hasText = message.text.trim().length > 0;

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <div className={`chat-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
      <div
        className={[
          'chat-bubble',
          isOwn ? 'chat-bubble--own' : 'chat-bubble--other',
          !hasText && attachments.length > 0 ? 'chat-bubble--media-only' : '',
        ].join(' ')}
      >
        {hasText && <p className="chat-bubble__text">{message.text}</p>}

        {attachments.length > 0 && (
          <div className="chat-bubble__attachments">
            {imageAttachments.length > 0 && (
              <div
                className={`chat-bubble__image-grid chat-bubble__image-grid--${Math.min(imageAttachments.length, 4)}`}
              >
                {imageAttachments.map((attachment, index) => {
                  if (attachment.status === 'rejected') {
                    return (
                      <div
                        key={`${attachment.url}-${index}`}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2"
                        role="alert"
                      >
                        <span>🔒</span>
                        <span>Attachment removed for security reasons</span>
                      </div>
                    );
                  }

                  const imgSrc = attachment.displayUrl || attachment.thumbnailUrl || attachment.url;
                  return (
                    <button
                      key={`${attachment.url}-${index}`}
                      type="button"
                      className="chat-bubble__image-button"
                      onClick={() => openLightbox(index)}
                      aria-label={`Open image attachment ${index + 1}`}
                    >
                      <img
                        src={imgSrc}
                        alt={attachment.name ?? `Attachment ${index + 1}`}
                        className="chat-bubble__image"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {fileAttachments.length > 0 && (
              <div className="chat-bubble__files">
                {fileAttachments.map((attachment, index) => {
                  const kindLabel = buildAttachmentKindLabel(attachment);
                  const sizeLabel = formatFileSize(attachment.size);
                  return (
                    <a
                      key={`${attachment.url}-${index}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-bubble__file"
                    >
                      <span className="chat-bubble__file-icon" aria-hidden>
                        {buildAttachmentIcon(attachment)}
                      </span>
                      <span className="chat-bubble__file-meta">
                        <span className="chat-bubble__file-name">
                          {attachment.name?.trim() || kindLabel}
                        </span>
                        <span className="chat-bubble__file-kind">
                          {kindLabel}
                          {sizeLabel ? ` · ${sizeLabel}` : ''}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="chat-bubble__footer">
          <span className="chat-bubble__time">{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span
              className={`chat-bubble__receipt ${message.readAt ? 'chat-bubble__receipt--read' : 'chat-bubble__receipt--sent'}`}
              title={message.readAt ? `Read ${formatTime(message.readAt)}` : 'Sent'}
              aria-label={message.readAt ? 'Read' : 'Sent'}
            >
              {message.readAt ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>


      {imageAttachments.length > 0 && (
        <ChatImageLightbox
          images={imageAttachments}
          open={isLightboxOpen}
          initialIndex={activeImageIndex}
          onOpenChange={setIsLightboxOpen}
        />
      )}
    </div>
  );
}
