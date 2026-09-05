"use client";

import { useState, useEffect } from "react";
import { Tag, Stack, Grid, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@esparex/ui";
import {
    AD_PLACEMENT_LOCATION, AD_FORMAT, GOOGLE_AD_STATUS, AD_FALLBACK_STRATEGY,
    type AdPlacementLocationValue, type AdFormatValue, type GoogleAdStatusValue,
    type AdFallbackStrategyValue, type GoogleAdPlacementDTO,
} from "@esparex/contracts";
import { AdPlacementLocationSelect } from "./AdPlacementLocationSelect";

interface GoogleAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<GoogleAdPlacementDTO>) => Promise<boolean>;
    editingPlacement: GoogleAdPlacementDTO | null;
}

export function GoogleAdModal({ isOpen, onClose, onSave, editingPlacement }: GoogleAdModalProps) {
    const [name, setName] = useState("");
    const [placementKey, setPlacementKey] = useState("");
    const [adSlotId, setAdSlotId] = useState("");
    const [location, setLocation] = useState<AdPlacementLocationValue>(AD_PLACEMENT_LOCATION.HOMEPAGE_HERO);
    const [format, setFormat] = useState<AdFormatValue>(AD_FORMAT.LEADERBOARD_728x90);
    const [status, setStatus] = useState<GoogleAdStatusValue>(GOOGLE_AD_STATUS.ACTIVE);
    const [fallbackStrategy, setFallbackStrategy] = useState<AdFallbackStrategyValue>(AD_FALLBACK_STRATEGY.COLLAPSE);
    const [viewports, setViewports] = useState<("desktop" | "tablet" | "mobile")[]>(["desktop", "tablet", "mobile"]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editingPlacement) {
            setName(editingPlacement.name);
            setPlacementKey(editingPlacement.placementKey);
            setAdSlotId(editingPlacement.adSlotId);
            setLocation(editingPlacement.location);
            setFormat(editingPlacement.format);
            setStatus(editingPlacement.status);
            setFallbackStrategy(editingPlacement.fallbackStrategy || AD_FALLBACK_STRATEGY.COLLAPSE);
            setViewports(editingPlacement.viewports || ["desktop", "tablet", "mobile"]);
        } else {
            setName("");
            setPlacementKey("homepage_hero_top");
            setAdSlotId("");
            setLocation(AD_PLACEMENT_LOCATION.HOMEPAGE_HERO);
            setFormat(AD_FORMAT.LEADERBOARD_728x90);
            setStatus(GOOGLE_AD_STATUS.ACTIVE);
            setFallbackStrategy(AD_FALLBACK_STRATEGY.COLLAPSE);
            setViewports(["desktop", "tablet", "mobile"]);
        }
    }, [editingPlacement, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const success = await onSave({ name, placementKey, adSlotId, location, format, status, fallbackStrategy, viewports });
            if (success) onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const toggleViewport = (vp: "desktop" | "tablet" | "mobile") => {
        setViewports((prev) => prev.includes(vp) ? prev.filter((item) => item !== vp) : [...prev, vp]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-lg p-0 overflow-hidden">
                <DialogHeader className="border-b border-border px-6 py-4 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Tag className="text-primary" size={20} />
                        <DialogTitle className="text-body-lg font-bold text-foreground">{editingPlacement ? "Edit Ad Placement" : "Create New Ad Placement"}</DialogTitle>
                    </div>
                    <DialogDescription className="sr-only">Configure Google AdSense slot parameters</DialogDescription>
                </DialogHeader>

                <Stack direction="col" gap="md" className="p-6 max-h-[80vh] overflow-y-auto" asChild>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Placement Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Homepage Top Leaderboard"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            />
                        </div>

                        <Grid cols={2} gap="sm">
                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Placement Key</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="homepage_hero_top"
                                    value={placementKey}
                                    onChange={(e) => setPlacementKey(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                />
                            </div>
                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">AdSense Slot ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 1234567890"
                                    value={adSlotId}
                                    onChange={(e) => setAdSlotId(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                />
                            </div>
                        </Grid>

                        <Grid cols={2} gap="sm">
                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Location</label>
                                <AdPlacementLocationSelect
                                    value={location}
                                    isCreating={!editingPlacement}
                                    onChange={(nextLoc) => {
                                        setLocation(nextLoc);
                                        if (!editingPlacement) setPlacementKey(nextLoc);
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Format</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as AdFormatValue)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                    <option value={AD_FORMAT.LEADERBOARD_728x90}>Leaderboard Banner (728x90)</option>
                                    <option value={AD_FORMAT.RECTANGLE_300x250}>Medium Rectangle (300x250)</option>
                                    <option value={AD_FORMAT.HALF_PAGE_300x600}>Half Page Banner (300x600)</option>
                                    <option value={AD_FORMAT.MOBILE_BANNER_320x50}>Mobile Banner (320x50)</option>
                                    <option value={AD_FORMAT.RESPONSIVE_AUTO}>Responsive Display (Auto-Scale)</option>
                                    <option value={AD_FORMAT.FLUID_NATIVE}>Fluid Native (In-Feed)</option>
                                </select>
                            </div>
                        </Grid>

                        <div>
                            <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Target Viewports</label>
                            <div className="flex items-center gap-4 pt-1">
                                {(["desktop", "tablet", "mobile"] as const).map((vp) => (
                                    <label key={vp} className="flex items-center gap-1.5 text-body font-medium text-foreground-secondary capitalize cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={viewports.includes(vp)}
                                            onChange={() => toggleViewport(vp)}
                                            className="rounded border-input text-primary focus-visible:ring-primary/40"
                                        />
                                        {vp}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Grid cols={2} gap="sm" className="pt-2">
                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as GoogleAdStatusValue)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                    <option value={GOOGLE_AD_STATUS.ACTIVE}>Active</option>
                                    <option value={GOOGLE_AD_STATUS.PAUSED}>Paused</option>
                                    <option value={GOOGLE_AD_STATUS.SCHEDULED}>Scheduled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Fallback Strategy</label>
                                <select
                                    value={fallbackStrategy}
                                    onChange={(e) => setFallbackStrategy(e.target.value as AdFallbackStrategyValue)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-body text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                >
                                    <option value={AD_FALLBACK_STRATEGY.COLLAPSE}>Collapse Container</option>
                                    <option value={AD_FALLBACK_STRATEGY.INTERNAL_PROMO}>Internal Promo Banner</option>
                                </select>
                            </div>
                        </Grid>

                        <DialogFooter className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting}
                            >
                                {submitting ? "Saving..." : editingPlacement ? "Update Placement" : "Create Placement"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
