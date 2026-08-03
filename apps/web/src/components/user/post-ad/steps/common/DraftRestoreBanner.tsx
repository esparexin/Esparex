"use client";

import { useEffect, useState } from "react";
import { usePostAdFlow, usePostAdAction } from "../../context";
import { usePostAdDraft } from "../../hooks/usePostAdDraft";
import { Button } from "@esparex/ui";
import { RotateCcw, X } from "@/icons/IconRegistry";

export function DraftRestoreBanner() {
  const { form, currentStep, isEditMode } = usePostAdFlow();
  const { setCurrentStep } = usePostAdAction();
  const { getSavedDraft, restoreDraft, clearDraft } = usePostAdDraft(
    form,
    currentStep,
    setCurrentStep,
    isEditMode
  );

  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isEditMode) return;
    const draft = getSavedDraft();
    if (draft && (draft.values.category || draft.values.title || draft.values.description)) {
      setDraftTimestamp(draft.updatedAt);
    }
  }, [getSavedDraft, isEditMode]);

  if (!draftTimestamp || dismissed || isEditMode) return null;

  const formattedDate = new Date(draftTimestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleRestore = () => {
    restoreDraft();
    setDismissed(true);
  };

  const handleDiscard = () => {
    clearDraft();
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs sm:text-sm shadow-2xs mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="truncate">
          You have an unsaved draft from <strong>{formattedDate}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRestore}
          className="h-8 px-3 text-xs font-semibold bg-white border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Restore Draft
        </Button>
        <button
          type="button"
          onClick={handleDiscard}
          className="p-1 text-slate-500 hover:text-slate-800 transition-colors rounded-lg focus:outline-none"
          aria-label="Discard saved draft"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
