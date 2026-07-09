"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

interface LocationPermissionBlockedModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    onUseManualLocation: () => void;
    onOpenBrowserSettings?: () => void; // Kept for contract parity, but unused internally now
}

export default function LocationPermissionBlockedModal({
    isOpen,
    onDismiss,
    onUseManualLocation,
}: LocationPermissionBlockedModalProps) {
    const [showHelp, setShowHelp] = useState(false);

    // Focus restoration is handled natively by shadcn's Dialog (Radix UI)
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
            <DialogContent 
                className="sm:max-w-md"
                aria-describedby="location-blocked-desc"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        Location Access Disabled
                    </DialogTitle>
                    <DialogDescription id="location-blocked-desc" className="mt-4 space-y-3 text-sm text-foreground">
                        <p>
                            Location access is disabled for this site. Enable it in your {"browser's"} site settings to use the auto-detect feature.
                        </p>
                    </DialogDescription>
                </DialogHeader>

                {/* Progressive Disclosure for Browser Instructions */}
                <div className="mt-2">
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        aria-expanded={showHelp}
                        aria-controls="browser-help-content"
                    >
                        {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Need help enabling location?
                    </button>
                    
                    {showHelp && (
                        <div 
                            id="browser-help-content" 
                            className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-2"
                        >
                            <p className="font-semibold">General Instructions:</p>
                            <ol className="list-decimal pl-5 space-y-1.5 marker:text-slate-400">
                                <li>Click the lock or info icon (<span className="inline-block align-middle font-bold">🔒 / ⓘ</span>) next to the URL bar.</li>
                                <li>Find the <strong>Location</strong> setting.</li>
                                <li>Change it to <strong>Allow</strong>.</li>
                                <li>Refresh this page.</li>
                            </ol>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    {/* Primary action is now Choose Manually since automatic is broken */}
                    <Button
                        type="button"
                        className="w-full sm:w-auto h-11"
                        onClick={() => {
                            onUseManualLocation();
                            onDismiss();
                        }}
                    >
                        Choose Manually
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto h-11"
                        onClick={onDismiss}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
