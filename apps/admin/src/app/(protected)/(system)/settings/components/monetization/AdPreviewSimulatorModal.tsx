"use client";

import { useState } from "react";
import { Sparkles, Monitor, Tablet, Smartphone } from "lucide-react";
import type { InContentPlacementId } from "@esparex/contracts";
import { PLACEMENT_LABELS } from "./CampaignListTable";

interface AdPreviewSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishingEnabled: boolean;
}

export function AdPreviewSimulatorModal({
  isOpen,
  onClose,
  publishingEnabled,
}: AdPreviewSimulatorModalProps) {
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewPlacement, setPreviewPlacement] = useState<InContentPlacementId>("listing_detail_sidebar_bottom");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl bg-card rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-body font-bold text-foreground">Multi-Device In-Content Ad Simulator</h3>
          </div>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`p-1.5 rounded-lg text-caption font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                previewDevice === "desktop" ? "bg-card text-primary shadow-xs" : "text-foreground-subtle hover:bg-muted/80 hover:text-foreground"
              }`}
              aria-label="Desktop view"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("tablet")}
              className={`p-1.5 rounded-lg text-caption font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                previewDevice === "tablet" ? "bg-card text-primary shadow-xs" : "text-foreground-subtle hover:bg-muted/80 hover:text-foreground"
              }`}
              aria-label="Tablet view"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`p-1.5 rounded-lg text-caption font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                previewDevice === "mobile" ? "bg-card text-primary shadow-xs" : "text-foreground-subtle hover:bg-muted/80 hover:text-foreground"
              }`}
              aria-label="Mobile view"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-center min-h-[300px]">
          <div
            className={`bg-card border border-border rounded-2xl p-4 shadow-xs transition-all text-center flex flex-col items-center justify-center gap-2 ${
              previewDevice === "desktop"
                ? "w-[480px] h-[260px]"
                : previewDevice === "tablet"
                ? "w-[360px] h-[240px]"
                : "w-[280px] h-[200px]"
            }`}
          >
            <span className="text-tiny font-bold uppercase tracking-widest text-foreground-subtle">
              {publishingEnabled ? "Live Ad Slot Preview" : "Ad Slot Inactive (Simulated)"}
            </span>
            <p className="text-caption font-bold text-foreground">
              {PLACEMENT_LABELS[previewPlacement]}
            </p>
            <span className="text-tiny font-mono text-primary">
              Device: {previewDevice.toUpperCase()} · Clean In-Content Container
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-caption font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
