import type { PopupState } from "./popupCore";

/**
 * Canonical notification facade (P1-2).
 *
 * Single owner per DECISION-GATE §3: ONE shared `notify` module in `@esparex/shared`.
 * Replaces the forked per-app implementations:
 * - `apps/web/src/lib/feedback.ts` (popupBus + logger + errorMapper)
 * - `apps/admin/src/lib/feedback.ts` (showAdminPopup + mapErrorToMessage)
 *
 * The bus instance and the error→message mapping are app-injected dependencies,
 * so each app keeps its own popup bus (web/admin prefixes) and its own
 * error-mapping behavior while sharing one facade implementation. There is
 * exactly one `notify` implementation in the monorepo.
 */

export type NotifyShowFn = (
  popup: Omit<PopupState, "id" | "open"> & { id?: string },
  options?: { dedupeKey?: string; dedupeMs?: number }
) => string;

export type NotifyErrorMapper = (error: unknown, fallback?: string) => string;

export interface NotifyLogSink {
  info: (...args: readonly unknown[]) => void;
  warn: (...args: readonly unknown[]) => void;
  error: (...args: readonly unknown[]) => void;
}

export interface NotifyChannelOptions {
  title?: string;
  description?: string;
  duration?: number;
  onRetry?: () => void;
}

export interface NotifyDeps {
  /** Canonical popup bus `show` — each app wires its own bus instance. */
  show: NotifyShowFn;
  /** App-owned error→message mapping (behavior preserved per app). */
  mapErrorToMessage: NotifyErrorMapper;
  /** Optional log sink (web logs notify calls; admin does not). */
  log?: NotifyLogSink;
}

export interface NotifyApi {
  success(message: string, options?: NotifyChannelOptions): void;
  error(
    error: unknown,
    fallbackOrOptions?: string | NotifyChannelOptions,
    options?: NotifyChannelOptions
  ): void;
  info(message: string, options?: NotifyChannelOptions): void;
  warning(message: string, options?: NotifyChannelOptions): void;
}

function isOptionsObject(
  value: unknown
): value is NotifyChannelOptions {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

/**
 * Builds the single shared `notify` facade bound to an app's popup bus.
 * Behavior contract (union of both legacy forks):
 * - `success`/`info`/`warning` emit with default titles ("Success"/"Info"/"Warning")
 *   unless a `title` override is supplied (admin fork supported overrides).
 * - `error` accepts a string fallback or an options object as the second argument
 *   (web fork passed the fallback through only for non-object seconds args —
 *   preserved exactly); the title is always "Error" unless overridden.
 * - Nothing is emitted during SSR (`typeof window === "undefined"`).
 */
export function createNotify({
  show,
  mapErrorToMessage,
  log,
}: NotifyDeps): NotifyApi {
  const notify: NotifyApi = {
    success(message: string, options?: NotifyChannelOptions) {
      if (typeof window === "undefined") return;
      log?.info("[SUCCESS]", message);
      show({
        type: "success",
        title: options?.title ?? "Success",
        message,
      });
    },

    error(
      error: unknown,
      fallbackOrOptions?: string | NotifyChannelOptions,
      options?: NotifyChannelOptions
    ) {
      // Mirrors the web fork's exact branching: an object second argument is
      // treated as options (no fallback is passed to the error mapper);
      // anything else is forwarded as the mapper fallback.
      const asOptions = isOptionsObject(fallbackOrOptions)
        ? fallbackOrOptions
        : undefined;
      let message: string;
      if (asOptions) {
        message = typeof error === "string" ? error : mapErrorToMessage(error);
      } else {
        message =
          typeof error === "string"
            ? error
            : mapErrorToMessage(error, fallbackOrOptions as string | undefined);
      }
      const title = asOptions?.title ?? options?.title ?? "Error";

      if (typeof window === "undefined") return;
      log?.error("[ERROR]", message);
      show({
        type: "error",
        title,
        message: message || "An unexpected error occurred.",
      });
    },

    info(message: string, options?: NotifyChannelOptions) {
      if (typeof window === "undefined") return;
      log?.info("[INFO]", message);
      show({
        type: "info",
        title: options?.title ?? "Info",
        message,
      });
    },

    warning(message: string, options?: NotifyChannelOptions) {
      if (typeof window === "undefined") return;
      log?.warn("[WARNING]", message);
      show({
        type: "warning",
        title: options?.title ?? "Warning",
        message,
      });
    },
  };

  return notify;
}
