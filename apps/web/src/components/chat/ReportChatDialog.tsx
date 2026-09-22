'use client';

import { ChatReportReasonValue } from "@esparex/contracts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  Label,
} from "@esparex/ui";

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
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isSubmitting) onCancel(); }}>
      <DialogContent className="max-w-md pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Report this conversation
          </DialogTitle>
          <DialogDescription>
            Help us keep Esparex safe by providing details about your concern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="chat-report-reason" className="text-body font-semibold text-foreground-secondary">
              Reason
            </Label>
            <Select
              value={reportReason}
              onValueChange={(val) => onReasonChange(val as ChatReportReasonValue)}
            >
              <SelectTrigger
                id="chat-report-reason"
                className="w-full h-11 rounded-xl border border-border bg-card px-3 text-body-lg md:text-body text-foreground shadow-xs"
              >
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chat-report-desc" className="text-body font-semibold text-foreground-secondary">
              Additional details (optional)
            </Label>
            <Textarea
              id="chat-report-desc"
              className="w-full min-h-[96px] rounded-xl border border-border bg-card p-3 text-body-lg md:text-body text-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20 resize-none leading-relaxed"
              value={reportDesc}
              onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
              placeholder="Describe the issue..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 px-5 rounded-xl border-border font-medium cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-11 px-5 rounded-xl font-semibold cursor-pointer"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
