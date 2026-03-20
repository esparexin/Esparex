"use client";
import * as React from "react";
import * as Sheet from "@radix-ui/react-dialog";
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
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Sheet.Trigger asChild>{trigger}</Sheet.Trigger>}

      <Sheet.Portal>
        <Sheet.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Sheet.Content
          className="
            fixed right-0 top-0 z-50 h-full
            w-[90vw] max-w-sm
            bg-background p-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right
          "
        >
          <div className="flex items-center justify-between mb-4">
            <Sheet.Title className="text-lg font-semibold text-foreground">
              {title}
            </Sheet.Title>
            <Sheet.Description className="sr-only">
              {title} panel
            </Sheet.Description>

            <Sheet.Close asChild>
              <button className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </button>
            </Sheet.Close>
          </div>

          <div className="h-full overflow-y-auto pb-8">
            {children}
          </div>
        </Sheet.Content>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
