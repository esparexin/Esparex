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
            ⚑ Report this conversation
          </DialogTitle>
          <DialogDescription>
            Help us keep Esparex safe by providing details about your concern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="block text-sm font-medium text-slate-700">
            Reason
            <select
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={reportReason}
              onChange={(e) => onReasonChange(e.target.value as ChatReportReasonValue)}
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Additional details (optional)
            <textarea
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={reportDesc}
              onChange={(e) => onDescriptionChange(e.target.value.slice(0, 500))}
              placeholder="Describe the issue…"
              rows={3}
              maxLength={500}
            />
          </label>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
