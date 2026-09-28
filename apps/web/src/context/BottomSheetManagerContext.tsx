"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

interface BottomSheetManagerContextType {
  activeSheetId: string | null;
  registerSheet: (id: string, options?: { onClose?: () => void }) => void;
  unregisterSheet: (id: string) => void;
  openSheet: (id: string) => void;
  closeSheet: (id: string) => void;
  closeAll: () => void;
}

const BottomSheetManagerContext = createContext<BottomSheetManagerContextType | undefined>(undefined);

export function BottomSheetManagerProvider({ children }: { children: React.ReactNode }) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [registeredSheets, setRegisteredSheets] = useState<Map<string, { onClose?: () => void }>>(new Map());

  const registerSheet = useCallback((id: string, options?: { onClose?: () => void }) => {
    setRegisteredSheets((prev) => {
      const next = new Map(prev);
      next.set(id, options ?? {});
      return next;
    });
  }, []);

  const unregisterSheet = useCallback((id: string) => {
    setRegisteredSheets((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    // If the unregistered sheet was active, clear it
    setActiveSheetId((current) => (current === id ? null : current));
  }, []);

  const openSheet = useCallback((id: string) => {
    // Close any currently active sheet before opening the new one
    setActiveSheetId((current) => {
      if (current !== null && current !== id) {
        const currentSheet = registeredSheets.get(current);
        currentSheet?.onClose?.();
      }
      return id;
    });
  }, [registeredSheets]);

  const closeSheet = useCallback((id: string) => {
    setActiveSheetId((current) => (current === id ? null : current));
    const sheet = registeredSheets.get(id);
    sheet?.onClose?.();
  }, [registeredSheets]);

  const closeAll = useCallback(() => {
    setActiveSheetId((current) => {
      if (current !== null) {
        const sheet = registeredSheets.get(current);
        sheet?.onClose?.();
      }
      return null;
    });
  }, [registeredSheets]);

  const value = useMemo(
    () => ({
      activeSheetId,
      registerSheet,
      unregisterSheet,
      openSheet,
      closeSheet,
      closeAll,
    }),
    [activeSheetId, registerSheet, unregisterSheet, openSheet, closeSheet, closeAll]
  );

  return (
    <BottomSheetManagerContext.Provider value={value}>
      {children}
    </BottomSheetManagerContext.Provider>
  );
}

export function useBottomSheetManager() {
  const context = useContext(BottomSheetManagerContext);
  if (context === undefined) {
    throw new Error("useBottomSheetManager must be used within a BottomSheetManagerProvider");
  }
  return context;
}