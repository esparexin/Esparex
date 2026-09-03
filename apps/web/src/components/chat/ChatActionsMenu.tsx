'use client';

import { useState } from 'react';
import {
  MoreVertical,
  Z_INDEX,
} from "@esparex/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChatActions } from '@/hooks/useChatActions';
import { CHAT_REPORT_REASON } from "@esparex/contracts";


import { ChatReportReasonValue } from "@esparex/contracts";
import { BlockChatDialog } from './BlockChatDialog';
import { ReportChatDialog } from './ReportChatDialog';
import { HideChatDialog } from './HideChatDialog';

interface ChatActionsMenuProps {
  conversationId: string;
  isArchived?: boolean;
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
  const [modal, setModal] = useState<null | 'block' | 'report' | 'hide'>(null);
  const [reportReason, setReportReason] = useState<ChatReportReasonValue>(REPORT_REASONS[0]!.value);
  const [reportDesc, setReportDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { block, hide, unhide, report } = useChatActions({ conversationId });

  const handleBlock = async () => {
    setIsSubmitting(true);
    try {
      await block();
      setFeedback('User blocked. This chat is now read-only.');
      setModal(null);
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
      await report({
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
      await hide();
      setFeedback('Conversation hidden from your inbox.');
      setModal(null);
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
      await unhide();
      setFeedback('Conversation restored to your inbox.');
      onActionComplete('restore');
    } catch {
      setFeedback('Failed to restore. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex-shrink-0 ml-1">
      {/* Action feedback popup */}
      {feedback && (
        <div className="chat-actions__feedback" role="status">
          {feedback}
          <button onClick={() => setFeedback(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="chat-actions__trigger"
            aria-label="Conversation options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4} style={{ zIndex: Z_INDEX.dropdown }} className="w-44">
          {isArchived ? (
            <DropdownMenuItem onClick={() => void handleRestore()}>
              ↩ Restore to inbox
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setModal('hide')}>
              📦 Archive / Hide
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setModal('block')}
            className="text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            🚫 Block User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModal('report')}>
            ⚑ Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
