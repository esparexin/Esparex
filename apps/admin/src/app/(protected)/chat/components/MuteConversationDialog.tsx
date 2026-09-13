"use client";

import {
  AlertTriangle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  RefreshCcw,
} from "@esparex/ui";
import type { AdminConvSummary } from "@/lib/api/adminChat";

export interface MuteConversationDialogProps {
  chat: AdminConvSummary | null;
  reason: string;
  isMuting: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: (chatId: string, reason: string) => Promise<void>;
}

export function MuteConversationDialog({
  chat,
  reason,
  isMuting,
  onReasonChange,
  onClose,
  onConfirm,
}: MuteConversationDialogProps) {
  return (
    <Dialog open={Boolean(chat)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="border-b border-border p-6 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
              <AlertTriangle size={20} />
            </div>
            <div>
              <DialogTitle className="text-body-lg font-bold text-foreground">Mute Conversation</DialogTitle>
              <DialogDescription className="text-caption text-foreground-tertiary">Silence this chat for all participants.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-tiny font-bold uppercase tracking-wider text-foreground-subtle">
              Reason for Muting (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g. Offensive language, Spam..."
              className="w-full min-h-[80px] rounded-lg border border-input bg-background p-3 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isMuting}
            onClick={() => chat && onConfirm(chat.id, reason)}
          >
            {isMuting && <RefreshCcw size={14} className="animate-spin" />}
            Confirm Mute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
