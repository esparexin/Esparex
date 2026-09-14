"use client";

import { useState, useCallback } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormError,
  Label,
  RadioGroup,
  RadioGroupItem,
  CheckCircle,
  Store,
  ExternalLink,
  MoreHorizontal,
} from "@esparex/ui";
import { notify } from "@/lib/feedback";
import logger from "@/lib/logger";

export type SoldReason = "sold_on_platform" | "sold_outside" | "no_longer_available";

export const SOLD_REASON_OPTIONS: Array<{
  value: SoldReason;
  label: string;
  description: string;
  icon: typeof Store;
}> = [
  {
    value: "sold_on_platform",
    label: "Sold on Esparex",
    description: "Buyer contacted me through this platform",
    icon: Store,
  },
  {
    value: "sold_outside",
    label: "Sold on Another Platform",
    description: "Sold through a different website or app",
    icon: ExternalLink,
  },
  {
    value: "no_longer_available",
    label: "Others (Offline / Direct)",
    description: "Sold directly to someone I know or offline",
    icon: MoreHorizontal,
  },
];

export interface MarkAsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adTitle?: string;
  description?: string;
  inputName?: string;
  selectedReason?: SoldReason | null;
  onReasonChange?: (reason: SoldReason) => void;
  onConfirm?: () => void | Promise<void>;
  onSoldConfirm?: (platform: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function MarkAsSoldDialog({
  open,
  onOpenChange,
  adTitle,
  description = "Congratulations on your sale! Please let us know where you sold this item.",
  selectedReason: controlledReason,
  onReasonChange: setControlledReason,
  onConfirm,
  onSoldConfirm,
  isSubmitting: controlledSubmitting = false,
}: MarkAsSoldDialogProps) {
  const [internalReason, setInternalReason] = useState<SoldReason | "">("");
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeReason = controlledReason !== undefined ? controlledReason : internalReason;
  const isSubmitting = controlledSubmitting || internalSubmitting;

  const handleReasonChange = useCallback(
    (val: string) => {
      setError(null);
      const reason = val as SoldReason;
      if (setControlledReason) {
        setControlledReason(reason);
      } else {
        setInternalReason(reason);
      }
    },
    [setControlledReason]
  );

  const handleSubmit = async () => {
    if (!activeReason) {
      setError("Please select where the item was sold");
      return;
    }

    setError(null);
    setInternalSubmitting(true);
    try {
      if (onSoldConfirm) {
        const success = await onSoldConfirm(activeReason);
        if (success) {
          onOpenChange(false);
          const platformText =
            activeReason === "sold_on_platform"
              ? "Esparex"
              : activeReason === "sold_outside"
                ? "another platform"
                : "offline";
          notify.success(`Ad marked as sold on ${platformText}!`, {
            description: "Your ad has been marked as sold and is now inactive.",
          });
        }
      } else if (onConfirm) {
        await onConfirm();
        onOpenChange(false);
      }
    } catch (err) {
      logger.error("Sold confirmation error:", err);
      setError("Failed to mark ad as sold. Please try again.");
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="flex items-center gap-2 text-body-lg font-bold text-foreground">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            Mark as Sold
          </DialogTitle>
          <DialogDescription className="text-caption text-foreground-subtle leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3">
          {adTitle && (
            <div className="bg-muted/50 p-3 rounded-xl border border-border">
              <p className="text-tiny font-medium text-foreground-subtle mb-0.5">Listing</p>
              <p className="text-caption font-semibold text-foreground line-clamp-2">{adTitle}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-caption font-semibold text-foreground">Where was it sold?</Label>
            <RadioGroup
              value={activeReason || ""}
              onValueChange={handleReasonChange}
              className="gap-2"
            >
              {SOLD_REASON_OPTIONS.map((opt) => {
                const isSelected = activeReason === opt.value;
                const Icon = opt.icon;
                return (
                  <label
                    key={opt.value}
                    htmlFor={`sold-opt-${opt.value}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`sold-opt-${opt.value}`} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-caption text-foreground">
                        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                        {opt.label}
                      </div>
                      <p className="text-tiny text-foreground-subtle mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
            <FormError message={error} />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
            <p className="text-tiny text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Once marked as sold, this listing will be marked inactive and removed from public search feeds.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-1 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-10 rounded-xl text-caption font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!activeReason || isSubmitting}
            className="w-full sm:w-auto h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-bold rounded-xl shadow-xs cursor-pointer"
          >
            {isSubmitting ? "Updating..." : "Confirm Sold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
