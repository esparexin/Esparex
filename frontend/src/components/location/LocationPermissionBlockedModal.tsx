"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Settings } from "lucide-react";

interface LocationPermissionBlockedModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    onUseManualLocation: () => void;
    onOpenBrowserSettings: () => void;
}

export default function LocationPermissionBlockedModal({
    isOpen,
    onDismiss,
    onUseManualLocation,
    onOpenBrowserSettings,
}: LocationPermissionBlockedModalProps) {
    const handleOpenBrowserSettings = () => {
        // Guide user to browser settings
        onOpenBrowserSettings();
        
        const userAgent = navigator.userAgent.toLowerCase();
        let settingsUrl = "";
        
        // Chrome and Chromium-based browsers
        if (userAgent.includes("chrome") || userAgent.includes("edge") || userAgent.includes("opera")) {
            settingsUrl = "chrome://settings/content/location";
        }
        // Firefox
        else if (userAgent.includes("firefox")) {
            settingsUrl = "about:preferences#privacy";
        }
        // Safari on macOS
        else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
            alert("To enable location access in Safari:\n1. Open System Preferences\n2. Go to Security & Privacy\n3. Select Location Services\n4. Enable Safari");
            return;
        }
        
        if (settingsUrl) {
            window.open(settingsUrl, "browser_settings");
        } else {
            alert("Please enable location access in your browser settings to use auto-detect feature.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-yellow-600" />
                        Location Access Disabled
                    </DialogTitle>
                    <DialogDescription className="mt-4 space-y-3 text-sm text-foreground">
                        <p>
                            Location access is disabled in your browser. You need to enable it to use the auto-detect feature.
                        </p>
                        <p className="font-medium">
                            To fix this:
                        </p>
                        <ol className="list-decimal space-y-2 pl-5">
                            <li>Click "Open Browser Settings" below</li>
                            <li>Find the location/geolocation permission for this site</li>
                            <li>Change it from "Deny" or "Block" to "Allow"</li>
                            <li>Refresh the page and try again</li>
                        </ol>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                        type="button"
                        size="sm"
                        className="gap-2"
                        onClick={handleOpenBrowserSettings}
                    >
                        <Settings className="h-4 w-4" />
                        Open Browser Settings
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            onUseManualLocation();
                            onDismiss();
                        }}
                    >
                        <MapPin className="h-4 w-4" />
                        Use Manual Location
                    </Button>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                    Note: Manual location must be used until you reset the browser permission.
                </p>
            </DialogContent>
        </Dialog>
    );
}
