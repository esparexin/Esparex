"use client";

import { mapErrorToMessage } from "@/lib/errorMapper";
import type { ProfileFieldErrors } from "@/components/user/profile/types";

export const getErrorMessage = (rawError: unknown, fallback: string): string =>
  mapErrorToMessage(rawError, fallback);

export const getErrorPayload = (rawError: unknown): Record<string, unknown> | null => {
  const responseData = (rawError as { response?: { data?: unknown } })?.response?.data;
  if (!responseData || typeof responseData !== "object") return null;
  const topLevel = responseData as Record<string, unknown>;
  if (topLevel.data && typeof topLevel.data === "object") return topLevel.data as Record<string, unknown>;
  return topLevel;
};

export const normalizeFieldName = (value: unknown): string => {
  if (typeof value === "string") return value.split(".").pop()?.trim() || "";
  if (Array.isArray(value)) {
    const last = value[value.length - 1];
    return typeof last === "string" ? last.trim() : "";
  }
  return "";
};

export const mapProfileValidationError = (
  rawError: unknown
): { fieldErrors: ProfileFieldErrors; globalError?: string } | null => {
  const payload = getErrorPayload(rawError);
  if (!payload) return null;

  const fieldErrors: ProfileFieldErrors = {};
  let globalError: string | undefined;

  const pushFieldError = (fieldName: string, message: string) => {
    if (["name", "email", "businessName", "gstNumber", "photo"].includes(fieldName)) {
      (fieldErrors as Record<string, string>)[fieldName] = message;
      return true;
    }
    if (fieldName === "profilePhoto" || fieldName === "avatar") {
      fieldErrors.photo = message;
      return true;
    }
    return false;
  };

  const details = Array.isArray(payload.details) ? payload.details : Array.isArray(payload.errors) ? payload.errors : null;
  if (details) {
    for (const detail of details) {
      if (!detail || typeof detail !== "object") continue;
      const record = detail as { field?: unknown; path?: unknown; message?: unknown; msg?: unknown };
      const fieldName = normalizeFieldName(record.field ?? record.path);
      const message = typeof record.message === "string" ? record.message : typeof record.msg === "string" ? record.msg : undefined;
      if (!message) continue;
      if (!pushFieldError(fieldName, message) && !globalError) globalError = message;
    }
  }

  if (payload.fieldErrors && typeof payload.fieldErrors === "object") {
    const map = payload.fieldErrors as Record<string, unknown>;
    for (const [fieldKey, messageValue] of Object.entries(map)) {
      if (typeof messageValue !== "string") continue;
      const fieldName = normalizeFieldName(fieldKey);
      if (!pushFieldError(fieldName, messageValue) && !globalError) globalError = messageValue;
    }
  }

  if (!globalError) {
    const fallbackError = payload.error;
    const fallbackMessage = payload.message;
    if (typeof fallbackError === "string") globalError = fallbackError;
    else if (typeof fallbackMessage === "string") globalError = fallbackMessage;
  }

  if (!Object.values(fieldErrors).some(Boolean) && !globalError) return null;
  return { fieldErrors, globalError };
};

export const emptyProfileFieldErrors = (): ProfileFieldErrors => ({
  name: undefined,
  email: undefined,
  businessName: undefined,
  gstNumber: undefined,
  photo: undefined,
});
