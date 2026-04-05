import type { FieldPath, UseFormReturn } from "react-hook-form";
import { isAPIError } from "@/lib/api/APIError";
import { EsparexError } from "@/lib/errorHandler";

type BackendFieldError = { field: string; message: string };

function isFieldError(item: unknown): item is BackendFieldError {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof (item as BackendFieldError).field === "string" &&
    (item as BackendFieldError).field.length > 0 &&
    typeof (item as BackendFieldError).message === "string"
  );
}

function extractDetailsPayload(error: unknown): unknown {
  if (isAPIError(error)) {
    return error.details ?? error.response?.data;
  }

  if (error instanceof EsparexError) {
    return error.context?.details;
  }

  if (!error || typeof error !== "object") return undefined;

  const record = error as {
    details?: unknown;
    context?: { details?: unknown };
    response?: { data?: unknown };
  };

  return record.details ?? record.context?.details ?? record.response?.data;
}

function extractFieldErrors(payload: unknown): BackendFieldError[] {
  if (Array.isArray(payload)) {
    return payload.filter(isFieldError);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.details)) {
    return record.details.filter(isFieldError);
  }

  if (record.details && typeof record.details === "object" && !Array.isArray(record.details)) {
    return Object.entries(record.details as Record<string, unknown>)
      .flatMap(([field, message]) => typeof message === "string" ? [{ field, message }] : []);
  }

  return Object.entries(record)
    .flatMap(([field, message]) => typeof message === "string" ? [{ field, message }] : []);
}

/**
 * Injects API field-level validation errors into react-hook-form state.
 *
 * Backend format: `error.details = [{ field: "email", message: "..." }, ...]`
 *
 * Returns true if at least one field error was injected (caller can skip
 * showing a generic popup since the field itself is highlighted).
 */
export function injectApiErrors<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  error: unknown,
): boolean {
  const details = extractFieldErrors(extractDetailsPayload(error));
  if (details.length === 0) return false;

  let injected = false;
  for (const item of details) {
    if (isFieldError(item)) {
      form.setError(item.field as FieldPath<T>, {
        type: "server",
        message: item.message,
      });
      injected = true;
    }
  }

  // Scroll to the first errored field so it's visible
  if (injected) {
    const firstField = details.find(isFieldError) as BackendFieldError;
    if (firstField && typeof document !== "undefined") {
      const el = document.querySelector(`[name='${firstField.field}']`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return injected;
}
