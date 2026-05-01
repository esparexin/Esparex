import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Trash2 } from "@/components/ui/icons";

interface PhotoOptionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPhotoSelect: () => void;
    onPhotoDelete: () => void;
}

export function PhotoOptionsDialog({
    open,
    onOpenChange,
    onPhotoSelect,
    onPhotoDelete,
}: PhotoOptionsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-link">
                        <Camera className="h-5 w-5" />
                        Profile Photo Options
                    </DialogTitle>
                    <DialogDescription>
                        Choose what you'd like to do with your profile photo
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-12"
                        onClick={onPhotoSelect}
                    >
                        <Upload className="h-4 w-4" />
                        Change Photo
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={onPhotoDelete}
                    >
                        <Trash2 className="h-4 w-4" />
                        Remove Photo
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
