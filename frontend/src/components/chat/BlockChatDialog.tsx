'use client';

interface BlockChatDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BlockChatDialog({ open, isSubmitting, onCancel, onConfirm }: BlockChatDialogProps) {
  if (!open) return null;

  return (
    <div className="chat-modal-overlay" role="dialog" aria-modal aria-label="Block user">
      <div className="chat-modal">
        <h2 className="chat-modal__title">🚫 Block this user?</h2>
        <p className="chat-modal__body">
          This chat will become read-only and you won't receive further messages.
        </p>
        <div className="chat-modal__actions">
          <button className="chat-modal__cancel" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="chat-modal__confirm chat-modal__confirm--danger" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Blocking…' : 'Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
