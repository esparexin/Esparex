import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { notify } from "@/lib/notify";
import { AlertTriangle } from "lucide-react";
import { FormError } from "../ui/FormError";
import { mapErrorToMessage } from "@/lib/errorMapper";
import { useAuth } from "@/context/AuthContext";
import { buildLoginUrl } from "@/lib/authHelpers";

interface ReportAdDialogProps {
  adId: string | number;
  adTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReportReasonValue =
  | "SPAM"
  | "SCAM"
  | "PROHIBITED_ITEM"
  | "OFFENSIVE_CONTENT"
  | "MISLEADING_INFO"
  | "SOLD_ELSEWHERE"
  | "OTHER";

const reportReasonOptions: Array<{ label: string; value: ReportReasonValue }> = [
  { label: "Fraudulent or Scam", value: "SCAM" },
  { label: "Inappropriate Content", value: "OFFENSIVE_CONTENT" },
  { label: "Spam", value: "SPAM" },
  { label: "Prohibited Item", value: "PROHIBITED_ITEM" },
  { label: "Misleading Information", value: "MISLEADING_INFO" },
  { label: "Sold Item Still Listed", value: "SOLD_ELSEWHERE" },
  { label: "Other", value: "OTHER" },
];

export function ReportAdDialog({
  adId,
  adTitle,
  open,
  onOpenChange,
}: ReportAdDialogProps) {
  const router = useRouter();
  const { user, isAuthResolved } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReasonValue | "">("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [additionalInfoError, setAdditionalInfoError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setAdditionalInfoError(null);

    if (!user) {
      if (!isAuthResolved) return;

      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}${window.location.hash}`
          : "/";

      onOpenChange(false);
      void router.push(buildLoginUrl(returnTo));
      return;
    }

    if (!selectedReason) {
      setReasonError("Please select a reason for reporting");
      return;
    }
    const normalizedAdId = String(adId ?? "").trim();
    if (!/^[a-f\d]{24}$/i.test(normalizedAdId)) {
      setGlobalError("Invalid ad identifier. Please refresh the page and try again.");
      return;
    }
    if (additionalInfo.trim().length > 500) {
      setAdditionalInfoError("Additional information must be 500 characters or less.");
      return;
    }

    setReasonError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post(API_ROUTES.USER.REPORTS, {
        adId: normalizedAdId,
        adTitle,
        reason: selectedReason,
        // `additionalDetails` is canonical in backend validator; keep `description`
        // for compatibility with existing controller fallback logic.
        additionalDetails: additionalInfo.trim(),
        description: additionalInfo.trim()
      }, {
        silent: true
      });



      notify.success("Report submitted successfully. We'll review it shortly.");
      setSelectedReason("");
      setAdditionalInfo("");
      setReasonError(null);
      setAdditionalInfoError(null);
      setGlobalError(null);
      onOpenChange(false);
    } catch (error) {
      setGlobalError(mapErrorToMessage(error, "Failed to submit report. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle>Report Ad</DialogTitle>
          </div>
          <DialogDescription>
            Report Ad #{adId} - {adTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Reason for reporting *</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => {
                setSelectedReason(value as ReportReasonValue);
                if (reasonError) setReasonError(null);
                if (globalError) setGlobalError(null);
              }}
            >
              {reportReasonOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <FormError message={reasonError} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-info">
              Additional Information (Optional)
            </Label>
            <Textarea
              id="additional-info"
              placeholder="Provide any additional details..."
              value={additionalInfo}
              onChange={(e) => {
                setAdditionalInfo(e.target.value);
                if (additionalInfoError) setAdditionalInfoError(null);
                if (globalError) setGlobalError(null);
              }}
              rows={4}
            />
            <FormError message={additionalInfoError} />
          </div>

          <FormError message={globalError} />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
