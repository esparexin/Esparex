import type { FieldPath, UseFormReturn } from "react-hook-form";
import { isAPIError } from "@/lib/api/APIError";

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
  if (!isAPIError(error)) return false;
  const details = error.details;
  if (!Array.isArray(details) || details.length === 0) return false;

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
    if (firstField) {
      const el = document.querySelector(`[name='${firstField.field}']`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return injected;
}
