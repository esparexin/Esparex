"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { LoginFlow } from "@/components/auth/LoginFlow";
import { Button } from "@/components/ui/button";
import { normalizeAuthCallbackUrl } from "@/utils/authHelpers";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
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
        <DialogOverlay className="bg-slate-900/40 backdrop-blur-[2px]" />
        <RadixDialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200"
          aria-describedby={undefined}
        >
          <RadixDialog.Title className="sr-only">Login</RadixDialog.Title>
          <div className="rounded-2xl border bg-white shadow-2xl overflow-hidden mx-4 sm:mx-0">
            <div className="flex items-center justify-end border-b px-3 py-2.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
                aria-label="Close login"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <LoginFlow
              mode="modal"
              callbackUrl={callbackUrl}
              onBack={handleDismiss}
            />
          </div>
        </RadixDialog.Content>
      </DialogPortal>
    </Dialog>
  );
}
