"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { LoginFlow } from "@/components/auth/LoginFlow";
import { Button } from "@/components/ui/button";
import { normalizeAuthCallbackUrl } from "@/lib/authHelpers";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Z_INDEX } from "@/lib/zIndexConfig";
import * as RadixDialog from "@radix-ui/react-dialog";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    return normalizeAuthCallbackUrl(raw);
  }, [searchParams]);

  const handleDismiss = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    void router.replace("/");
  }, [router]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-slate-900/10 backdrop-blur-[1px]" />
        <RadixDialog.Content
          style={{ zIndex: Z_INDEX.dialogContent }}
          className={[
            // Mobile: anchor near top so keyboard can't cover the form
            "fixed left-1/2 top-4 w-full max-w-md -translate-x-1/2 outline-none",
            // Desktop: vertically centre as before
            "sm:top-1/2 sm:-translate-y-1/2",
            // Animations
            "animate-in fade-in-0 zoom-in-95 duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          ].join(" ")}
          aria-describedby={undefined}
        >
          <RadixDialog.Title className="sr-only">Login</RadixDialog.Title>

          {/*
           * max-h uses 100dvh (dynamic viewport height — shrinks when keyboard opens).
           * flex-col lets the header stay fixed while only the form body scrolls.
           */}
          <div className="mx-4 sm:mx-0 rounded-2xl border bg-white shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">
            {/* Fixed header — always visible above keyboard */}
            <div className="flex flex-shrink-0 items-center justify-end border-b px-3 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleDismiss}
                aria-label="Close login"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable form area — scrolls under the fixed header when keyboard shrinks space */}
            <div className="overflow-y-auto">
              <LoginFlow
                mode="modal"
                callbackUrl={callbackUrl}
                onBack={handleDismiss}
              />
            </div>
          </div>
        </RadixDialog.Content>
      </DialogPortal>
    </Dialog>
  );
}
