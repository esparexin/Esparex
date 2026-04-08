'use client';

interface HideChatDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function HideChatDialog({ open, isSubmitting, onCancel, onConfirm }: HideChatDialogProps) {
  if (!open) return null;

  return (
    <div className="chat-modal-overlay" role="dialog" aria-modal aria-label="Hide conversation">
      <div className="chat-modal">
        <div className="chat-modal__header">
          <h2 className="chat-modal__title">📦 Archive this conversation?</h2>
        </div>
        <div className="chat-modal__content">
          <p className="chat-modal__body">
            This conversation will be hidden from your inbox. The other person can still message you.
          </p>
        </div>
        <div className="chat-modal__actions">
          <button className="chat-modal__cancel" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="chat-modal__confirm" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Hiding…' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
