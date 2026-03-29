'use client';

import { useState, useRef, useEffect } from 'react';
import { chatApi } from "@/lib/api/chatApi";
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import { CHAT_REPORT_REASON } from '@shared/enums/chatStatus';
import type { ChatReportReasonValue } from '@shared/enums/chatStatus';
import { BlockChatDialog } from './BlockChatDialog';
import { ReportChatDialog } from './ReportChatDialog';
import { HideChatDialog } from './HideChatDialog';

interface ChatActionsMenuProps {
  conversationId: string;
  isArchived?: boolean;
  /** Called after block/hide so parent can refresh conv state */
  onActionComplete: (action: 'block' | 'hide' | 'restore') => void;
}

const REPORT_REASONS = [
  { value: CHAT_REPORT_REASON.SPAM,  label: 'Spam or unsolicited messages' },
  { value: CHAT_REPORT_REASON.SCAM,  label: 'Scam or fraud attempt' },
  { value: CHAT_REPORT_REASON.ABUSE, label: 'Harassment or abuse' },
  { value: CHAT_REPORT_REASON.FAKE,  label: 'Fake listing or identity' },
  { value: CHAT_REPORT_REASON.OTHER, label: 'Other' },
];

export function ChatActionsMenu({ conversationId, isArchived = false, onActionComplete }: ChatActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modal, setModal] = useState<null | 'block' | 'report' | 'hide'>(null);
  const [reportReason, setReportReason] = useState<ChatReportReasonValue>(REPORT_REASONS[0]!.value);
  const [reportDesc, setReportDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleBlock = async () => {
    setIsSubmitting(true);
    try {
      await chatApi.block(conversationId);
      setFeedback('User blocked. This chat is now read-only.');
      setModal(null);
      dispatchChatInboxUpdated();
      onActionComplete('block');
    } catch {
      setFeedback('Failed to block. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    setIsSubmitting(true);
    try {
      await chatApi.report({
        conversationId,
        reason: reportReason,
        description: reportDesc.trim() || undefined,
      });
      setFeedback('Report submitted. Our team will review within 24 hours.');
      setModal(null);
      setReportDesc('');
    } catch {
      setFeedback('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHide = async () => {
    setIsSubmitting(true);
    try {
      await chatApi.hide(conversationId);
      setFeedback('Conversation hidden from your inbox.');
      setModal(null);
      dispatchChatInboxUpdated();
      onActionComplete('hide');
    } catch {
      setFeedback('Failed to hide. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      await chatApi.unhide(conversationId);
      setFeedback('Conversation restored to your inbox.');
      dispatchChatInboxUpdated();
      onActionComplete('restore');
    } catch {
      setFeedback('Failed to restore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chat-actions" ref={menuRef}>
      {/* Feedback toast */}
      {feedback && (
        <div className="chat-actions__feedback" role="status">
          {feedback}
          <button onClick={() => setFeedback(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Trigger button */}
      <button
        className="chat-actions__trigger"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Conversation options"
        aria-expanded={isOpen}
      >
        ⋮
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="chat-actions__menu" role="menu">
          {isArchived ? (
            <button
              role="menuitem"
              className="chat-actions__item chat-actions__item--restore"
              onClick={() => {
                setIsOpen(false);
                void handleRestore();
              }}
            >
              ↩ Restore to inbox
            </button>
          ) : (
            <button
              role="menuitem"
              className="chat-actions__item chat-actions__item--hide"
              onClick={() => { setIsOpen(false); setModal('hide'); }}
            >
              📦 Archive / Hide
            </button>
          )}
          <button
            role="menuitem"
            className="chat-actions__item chat-actions__item--block"
            onClick={() => { setIsOpen(false); setModal('block'); }}
          >
            🚫 Block User
          </button>
          <button
            role="menuitem"
            className="chat-actions__item chat-actions__item--report"
            onClick={() => { setIsOpen(false); setModal('report'); }}
          >
            ⚑ Report
          </button>
        </div>
      )}

      <BlockChatDialog
        open={modal === 'block'}
        isSubmitting={isSubmitting}
        onCancel={() => setModal(null)}
        onConfirm={handleBlock}
      />

      <ReportChatDialog
        open={modal === 'report'}
        isSubmitting={isSubmitting}
        reportReason={reportReason}
        reportDesc={reportDesc}
        reasons={REPORT_REASONS}
        onReasonChange={setReportReason}
        onDescriptionChange={setReportDesc}
        onCancel={() => setModal(null)}
        onSubmit={handleReport}
      />

      <HideChatDialog
        open={modal === 'hide'}
        isSubmitting={isSubmitting}
        onCancel={() => setModal(null)}
        onConfirm={handleHide}
      />
    </div>
  );
}
