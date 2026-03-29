'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { ChatAttachment } from '@shared/contracts/chat.contracts';

interface ChatImageLightboxProps {
  images: ChatAttachment[];
  open: boolean;
  initialIndex: number;
  onOpenChange: (open: boolean) => void;
}

export function ChatImageLightbox({
  images,
  open,
  initialIndex,
  onOpenChange,
}: ChatImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const activeImage = images[activeIndex];
  if (!activeImage) return null;

  const handlePrevious = () => {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const handleNext = () => {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="chat-image-lightbox" hideClose>
        <DialogTitle className="sr-only">
          {activeImage.name ?? `Chat image ${activeIndex + 1}`}
        </DialogTitle>

        <div className="chat-image-lightbox__frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={activeImage.name ?? `Chat image ${activeIndex + 1}`}
            className="chat-image-lightbox__image"
          />
        </div>

        <div className="chat-image-lightbox__footer">
          <div className="chat-image-lightbox__meta">
            <span className="chat-image-lightbox__label">
              {activeImage.name ?? `Image ${activeIndex + 1}`}
            </span>
            {images.length > 1 && (
              <span className="chat-image-lightbox__count">
                {activeIndex + 1} / {images.length}
              </span>
            )}
          </div>

          <div className="chat-image-lightbox__actions">
            {images.length > 1 && (
              <>
                <button type="button" className="chat-image-lightbox__nav" onClick={handlePrevious}>
                  Previous
                </button>
                <button type="button" className="chat-image-lightbox__nav" onClick={handleNext}>
                  Next
                </button>
              </>
            )}
            <a
              href={activeImage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-image-lightbox__open"
            >
              Open original
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
