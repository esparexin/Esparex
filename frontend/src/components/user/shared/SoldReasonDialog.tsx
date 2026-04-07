import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type SoldReason = "sold_on_platform" | "sold_outside" | "no_longer_available";

export const SOLD_REASON_OPTIONS: { value: SoldReason; label: string }[] = [
    { value: "sold_on_platform", label: "Sold on Esparex" },
    { value: "sold_outside", label: "Sold outside platform" },
    { value: "no_longer_available", label: "No longer available" },
];

interface SoldReasonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
    inputName: string;
    selectedReason: SoldReason | null;
    onReasonChange: (reason: SoldReason) => void;
    isSubmitting: boolean;
    onConfirm: () => void;
}

export function SoldReasonDialog({
    open,
    onOpenChange,
    description,
    inputName,
    selectedReason,
    onReasonChange,
    isSubmitting,
    onConfirm,
}: SoldReasonDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Mark as Sold</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground mb-3">{description}</p>
                <div className="space-y-2">
                    {SOLD_REASON_OPTIONS.map((option) => (
                        <label
                            key={option.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedReason === option.value 
                                    ? "border-blue-500 bg-blue-50" 
                                    : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <input
                                type="radio"
                                name={inputName}
                                value={option.value}
                                checked={selectedReason === option.value}
                                onChange={() => onReasonChange(option.value)}
                                className="accent-blue-600"
                            />
                            <span className="text-sm">{option.label}</span>
                        </label>
                    ))}
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={onConfirm} 
                        disabled={!selectedReason || isSubmitting} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSubmitting ? "Updating…" : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
