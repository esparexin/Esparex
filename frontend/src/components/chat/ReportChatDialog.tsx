'use client';

import type { ChatReportReasonValue } from '@shared/enums/chatStatus';

interface ReportReasonOption {
  value: ChatReportReasonValue;
  label: string;
}

interface ReportChatDialogProps {
  open: boolean;
  isSubmitting: boolean;
  reportReason: ChatReportReasonValue;
  reportDesc: string;
  reasons: ReportReasonOption[];
  onReasonChange: (reason: ChatReportReasonValue) => void;
  onDescriptionChange: (description: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function ReportChatDialog({
  open,
  isSubmitting,
  reportReason,
  reportDesc,
  reasons,
  onReasonChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
}: ReportChatDialogProps) {
  if (!open) return null;

  return (
    <div className="chat-modal-overlay" role="dialog" aria-modal aria-label="Report conversation">
      <div className="chat-modal">
        <div className="chat-modal__header">
          <h2 className="chat-modal__title">⚑ Report this conversation</h2>
        </div>
        <div className="chat-modal__content chat-modal__content--stack">
          <label className="chat-modal__label">
            Reason
            <select
              className="chat-modal__select"
              value={reportReason}
              onChange={(e) => onReasonChange(e.target.value as ChatReportReasonValue)}
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="chat-modal__label">
            Additional details (optional)
            <textarea
              className="chat-modal__textarea"
              value={reportDesc}
              onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
              placeholder="Describe the issue…"
              rows={3}
              maxLength={500}
            />
          </label>
        </div>
        <div className="chat-modal__actions">
          <button className="chat-modal__cancel" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="chat-modal__confirm" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
