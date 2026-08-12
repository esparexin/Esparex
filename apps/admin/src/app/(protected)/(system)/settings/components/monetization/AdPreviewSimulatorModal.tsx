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
      <div className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Multi-Device In-Content Ad Simulator</h3>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                previewDevice === "desktop" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
              aria-label="Desktop view"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("tablet")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                previewDevice === "tablet" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
              aria-label="Tablet view"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("mobile")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                previewDevice === "mobile" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500"
              }`}
              aria-label="Mobile view"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-center min-h-[300px]">
          <div
            className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-xs transition-all text-center flex flex-col items-center justify-center gap-2 ${
              previewDevice === "desktop"
                ? "w-[480px] h-[260px]"
                : previewDevice === "tablet"
                ? "w-[360px] h-[240px]"
                : "w-[280px] h-[200px]"
            }`}
          >
            <span className="text-2xs font-bold uppercase tracking-widest text-slate-400">
              {publishingEnabled ? "Live Ad Slot Preview" : "Ad Slot Inactive (Simulated)"}
            </span>
            <p className="text-xs font-bold text-slate-700">
              {PLACEMENT_LABELS[previewPlacement]}
            </p>
            <span className="text-2xs font-mono text-blue-600">
              Device: {previewDevice.toUpperCase()} · Clean In-Content Container
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
