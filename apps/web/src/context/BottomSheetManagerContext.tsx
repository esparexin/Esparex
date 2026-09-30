"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from "react";

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
  const activeSheetIdRef = useRef<string | null>(null);
  const sheetsRef = useRef<Map<string, { onClose?: () => void }>>(new Map());

  const registerSheet = useCallback((id: string, options?: { onClose?: () => void }) => {
    sheetsRef.current.set(id, options ?? {});
  }, []);

  const unregisterSheet = useCallback((id: string) => {
    sheetsRef.current.delete(id);
    if (activeSheetIdRef.current === id) {
      activeSheetIdRef.current = null;
      setActiveSheetId(null);
    }
  }, []);

  const openSheet = useCallback((id: string) => {
    const prev = activeSheetIdRef.current;
    if (prev === id) return;
    if (prev !== null) {
      const prevSheet = sheetsRef.current.get(prev);
      prevSheet?.onClose?.();
    }
    activeSheetIdRef.current = id;
    setActiveSheetId(id);
  }, []);

  const closeSheet = useCallback((id: string) => {
    if (activeSheetIdRef.current === id) {
      activeSheetIdRef.current = null;
      setActiveSheetId(null);
      const sheet = sheetsRef.current.get(id);
      sheet?.onClose?.();
    }
  }, []);

  const closeAll = useCallback(() => {
    const prev = activeSheetIdRef.current;
    if (prev !== null) {
      activeSheetIdRef.current = null;
      setActiveSheetId(null);
      const sheet = sheetsRef.current.get(prev);
      sheet?.onClose?.();
    }
  }, []);

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

const DEFAULT_MANAGER: BottomSheetManagerContextType = {
  activeSheetId: null,
  registerSheet: () => {}, unregisterSheet: () => {},
  openSheet: () => {}, closeSheet: () => {}, closeAll: () => {},
};

export function useBottomSheetManager() {
  return useContext(BottomSheetManagerContext) ?? DEFAULT_MANAGER;
}