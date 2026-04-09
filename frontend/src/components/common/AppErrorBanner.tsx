"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Z_INDEX } from "@/lib/zIndexConfig";

type AppErrorEventDetail = {
  message?: string;
};

const APP_ERROR_EVENT = "esparex:app-error";

export function emitAppError(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AppErrorEventDetail>(APP_ERROR_EVENT, {
      detail: { message },
    })
  );
}

export function AppErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onError = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorEventDetail>;
      const nextMessage = customEvent.detail?.message?.trim();
      if (!nextMessage) return;
      setMessage(nextMessage);
    };

    window.addEventListener(APP_ERROR_EVENT, onError);
    return () => {
      window.removeEventListener(APP_ERROR_EVENT, onError);
    };
  }, []);

  if (!message) return null;

  return (
    <div style={{ zIndex: Z_INDEX.appErrorBanner }} className="fixed inset-x-0 top-0 px-2 pt-2 sm:px-4 sm:pt-3">
      <div
        className="mx-auto flex w-full max-w-4xl items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 shadow-lg sm:px-4 sm:py-3"
        role="alert"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-red-700 hover:bg-red-100"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

