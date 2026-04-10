"use client";

import { useState, useCallback } from "react";
import { notify } from "@/lib/notify";
import { smartAlertFormSchema } from "@/schemas/smartAlertForm.schema";
import {
  SmartAlertCreateSchema,
  SmartAlertUpdateSchema,
} from "@shared/schemas/smartAlert.schema";
import type { SmartAlertCreatePayload } from "@shared/schemas/smartAlert.schema";
import { sanitizeMongoObjectId } from "@shared/listingUtils/locationUtils";
import { toCanonicalGeoPoint } from "@/lib/location/coordinates";
import type {
  SmartAlertFieldErrors,
  SmartAlertFormData,
  SmartAlertItem,
} from "@/components/user/profile/types";
import type { Location as AppLocation } from "@/lib/api/user/locations";

const createInitialSmartAlertForm = (): SmartAlertFormData => ({
  name: "",
  keywords: "",
  category: "",
  location: "",
  locationId: null,
  radius: 50,
  emailNotifications: true,
});

const emptySmartAlertFieldErrors = (): SmartAlertFieldErrors => ({
  name: undefined,
  keywords: undefined,
  category: undefined,
  location: undefined,
  radius: undefined,
});

type SmartAlertLocationSelection = Pick<
  AppLocation,
  "id" | "locationId" | "name" | "display" | "city" | "coordinates"
>;

interface UseProfileSmartAlertsProps {
  createSmartAlert: (data: SmartAlertCreatePayload) => Promise<unknown>;
  updateSmartAlert: (id: string, data: Partial<SmartAlertCreatePayload>) => Promise<unknown>;
}

export function useProfileSmartAlerts({
  createSmartAlert,
  updateSmartAlert
}: UseProfileSmartAlertsProps) {
  const [smartAlertForm, setSmartAlertForm] = useState<SmartAlertFormData>(createInitialSmartAlertForm);
  const [smartAlertErrors, setSmartAlertErrors] = useState<SmartAlertFieldErrors>(
    emptySmartAlertFieldErrors
  );
  const [smartAlertGlobalError, setSmartAlertGlobalError] = useState<string | null>(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  const resetAlertForm = useCallback(() => {
    setSmartAlertForm(createInitialSmartAlertForm());
    setSmartAlertErrors(emptySmartAlertFieldErrors());
    setSmartAlertGlobalError(null);
    setEditingAlertId(null);
  }, []);

  const updateSmartAlertForm = useCallback((updates: Partial<SmartAlertFormData>) => {
    setSmartAlertForm((prev) => ({ ...prev, ...updates }));
    const clearedErrors: Partial<SmartAlertFieldErrors> = {};
    for (const key of Object.keys(updates)) {
      if (key in emptySmartAlertFieldErrors()) {
        (clearedErrors as Record<string, string | undefined>)[key] = undefined;
      }
    }
    setSmartAlertErrors((prev) => ({ ...prev, ...clearedErrors }));
    setSmartAlertGlobalError(null);
  }, []);

  const clearSmartAlertError = useCallback((field: keyof SmartAlertFieldErrors) => {
    setSmartAlertErrors((prev) => ({ ...prev, [field]: undefined }));
    setSmartAlertGlobalError(null);
  }, []);

  const handleEditAlert = useCallback((alert: SmartAlertItem) => {
    setEditingAlertId(alert.id);
    setSmartAlertForm({
      name: alert.name,
      keywords: alert.keywords,
      category: alert.category,
      location: alert.location,
      locationId: alert.locationId || null,
      radius: alert.radius ?? 50,
      emailNotifications: alert.notificationChannels?.includes("email") ?? true,
    });
    setSmartAlertErrors(emptySmartAlertFieldErrors());
    setSmartAlertGlobalError(null);
  }, []);

  const handleCreateAlert = async (
    selectedLocation: SmartAlertLocationSelection | null = null
  ): Promise<void> => {
    const parsedForm = smartAlertFormSchema.safeParse(smartAlertForm);
    if (!parsedForm.success) {
      const nextErrors = emptySmartAlertFieldErrors();
      let nextGlobalError: string | null = null;

      for (const issue of parsedForm.error.issues) {
        const field = issue.path[0];
        if (field === "name") nextErrors.name = issue.message;
        else if (field === "keywords") nextErrors.keywords = issue.message;
        else if (field === "category") nextErrors.category = issue.message;
        else if (field === "location") nextErrors.location = issue.message;
        else if (field === "radius") nextErrors.radius = issue.message;
        else if (!nextGlobalError) nextGlobalError = issue.message;
      }

      setSmartAlertErrors(nextErrors);
      setSmartAlertGlobalError(nextGlobalError || "Please correct the highlighted fields.");
      return;
    }

    const {
      name,
      keywords,
      category,
      location,
      locationId,
      radius,
      emailNotifications,
    } = parsedForm.data;

    const canonicalCoordinates = toCanonicalGeoPoint(selectedLocation?.coordinates);
    const canonicalLocationId = sanitizeMongoObjectId(
      selectedLocation?.locationId || selectedLocation?.id || locationId
    );
    const locationDisplay =
      selectedLocation?.display ||
      selectedLocation?.name ||
      selectedLocation?.city ||
      location ||
      "";

    setSmartAlertErrors(emptySmartAlertFieldErrors());
    setSmartAlertGlobalError(null);

    const basePayload = {
      name,
      criteria: {
        keywords,
        category: category || undefined,
        location: locationDisplay || undefined,
        locationId: canonicalLocationId || undefined,
      },
      ...(canonicalCoordinates ? { coordinates: canonicalCoordinates } : {}),
      radiusKm: radius,
      frequency: "instant" as const,
      notificationChannels: emailNotifications ? ["email"] : ["push"],
    };

    if (!editingAlertId && (!canonicalCoordinates || !canonicalLocationId || !locationDisplay)) {
      setSmartAlertErrors((prev) => ({
        ...prev,
        location: "Please select a valid location from the location search.",
      }));
      return;
    }

    const parsedPayload = editingAlertId
      ? SmartAlertUpdateSchema.safeParse(basePayload)
      : SmartAlertCreateSchema.safeParse(basePayload);

    if (!parsedPayload.success) {
      const nextErrors = emptySmartAlertFieldErrors();
      let nextGlobalError: string | null = null;

      for (const issue of parsedPayload.error.issues) {
        const [root, nested] = issue.path;
        if (root === "name") nextErrors.name = issue.message;
        else if (root === "criteria" && nested === "keywords") nextErrors.keywords = issue.message;
        else if (root === "criteria" && nested === "category") nextErrors.category = issue.message;
        else if (root === "criteria" && (nested === "location" || nested === "locationId")) nextErrors.location = issue.message;
        else if (root === "radiusKm") nextErrors.radius = issue.message;
        else if (!nextGlobalError) nextGlobalError = issue.message;
      }

      setSmartAlertErrors(nextErrors);
      setSmartAlertGlobalError(nextGlobalError || "Please check alert details and try again.");
      return;
    }

    const requestPayload = parsedPayload.data as SmartAlertCreatePayload;
    const result = editingAlertId
      ? await updateSmartAlert(editingAlertId, requestPayload)
      : await createSmartAlert(requestPayload);

    if (typeof result === "object" && result !== null && "success" in result && (result as any).success) {
      resetAlertForm();
      notify.success(editingAlertId ? "Alert updated successfully." : "Alert created successfully.");
    } else {
      setSmartAlertGlobalError((result as any).error);
    }
  };

  return {
    smartAlertForm,
    setSmartAlertForm,
    updateSmartAlertForm,
    smartAlertErrors,
    setSmartAlertErrors,
    smartAlertGlobalError,
    setSmartAlertGlobalError,
    editingAlertId,
    setEditingAlertId,
    resetAlertForm,
    clearSmartAlertError,
    handleEditAlert,
    handleCreateAlert,
  };
}
