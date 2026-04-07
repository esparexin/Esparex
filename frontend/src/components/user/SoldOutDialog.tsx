import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { CheckCircle, Store, ExternalLink, MoreHorizontal } from "lucide-react";
import { notify } from "@/lib/notify";
import { FormError } from "../ui/FormError";
import logger from "@/lib/logger";

interface SoldOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adTitle: string;
  onSoldConfirm: (platform: string) => Promise<boolean>;
}

export function SoldOutDialog({
  open,
  onOpenChange,
  adTitle,
  onSoldConfirm,
}: SoldOutDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedPlatform) {
      setPlatformError("Please select where the item was sold");
      return;
    }

    setPlatformError(null);
    setGlobalError(null);
    setIsSubmitting(true);
    try {
      const soldConfirmed = await onSoldConfirm(selectedPlatform);
      if (!soldConfirmed) {
        return;
      }
      onOpenChange(false);

      const platformText =
        selectedPlatform === "this" ? "Esparex" :
          selectedPlatform === "another" ? "another platform" :
            "offline";

      notify.success(`Ad marked as sold on ${platformText}!`, {
        description: "Your ad has been marked as sold and is now inactive.",
      });
    } catch (error) {
      logger.error("Sold confirmation error:", error);
      setGlobalError("Failed to mark ad as sold. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mark as Sold
          </DialogTitle>
          <DialogDescription>
            Congratulations on your sale! Please let us know where you sold this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ad Title */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <p className="text-sm font-medium text-muted-foreground mb-1">Ad Title</p>
            <p className="text-sm font-semibold line-clamp-2">{adTitle}</p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Where was it sold?</Label>
            <RadioGroup value={selectedPlatform} onValueChange={setSelectedPlatform}>
              {/* This Platform */}
              <div
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlatform === "this"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => {
                  setSelectedPlatform("this");
                  if (platformError) setPlatformError(null);
                  if (globalError) setGlobalError(null);
                }}
              >
                <RadioGroupItem value="this" id="this" />
                <div className="flex-1">
                  <Label
                    htmlFor="this"
                    className="flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <Store className="h-4 w-4 text-green-600" />
                    Sold on Esparex
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Buyer contacted me through this platform
                  </p>
                </div>
              </div>

              {/* Another Platform */}
              <div
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlatform === "another"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => {
                  setSelectedPlatform("another");
                  if (platformError) setPlatformError(null);
                  if (globalError) setGlobalError(null);
                }}
              >
                <RadioGroupItem value="another" id="another" />
                <div className="flex-1">
                  <Label
                    htmlFor="another"
                    className="flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4 text-link" />
                    Sold on Another Platform
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sold through a different website or app
                  </p>
                </div>
              </div>

              {/* Others (Offline/Direct) */}
              <div
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlatform === "others"
                  ? "border-green-600 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
                  }`}
                onClick={() => {
                  setSelectedPlatform("others");
                  if (platformError) setPlatformError(null);
                  if (globalError) setGlobalError(null);
                }}
              >
                <RadioGroupItem value="others" id="others" />
                <div className="flex-1">
                  <Label
                    htmlFor="others"
                    className="flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4 text-slate-600" />
                    Others (Offline/Direct)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sold directly to someone I know or offline
                  </p>
                </div>
              </div>
            </RadioGroup>
            <FormError message={platformError} />
            <FormError message={globalError} />
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Once marked as sold, you cannot edit or reactivate this ad.
              The ad will be archived and removed from active listings.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedPlatform || isSubmitting}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Submitting..." : "Confirm Sold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
