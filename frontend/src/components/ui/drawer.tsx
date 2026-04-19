"use client";
import * as React from "react";
import { Drawer as VaulDrawer } from "vaul";
import { X } from "lucide-react";

export function Drawer({
  title,
  children,
  trigger,
  open,
  onOpenChange,
}: {
  title: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <VaulDrawer.Trigger asChild>{trigger}</VaulDrawer.Trigger>}

      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <VaulDrawer.Content
          className="bg-background flex flex-col rounded-t-[20px] shadow-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[96vh] focus:outline-none"
        >
          {/* Drag Handle */}
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-slate-200" />
          
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between p-4 pb-2">
            <VaulDrawer.Title className="text-lg font-semibold text-foreground">
              {title}
            </VaulDrawer.Title>
            <VaulDrawer.Description className="sr-only">
              {title} panel
            </VaulDrawer.Description>
            <VaulDrawer.Close asChild>
              <button className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground">
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </button>
            </VaulDrawer.Close>
          </div>

          {/* Scrollable Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
