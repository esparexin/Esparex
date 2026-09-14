"use client";

import React, { createContext, useContext, useState } from "react";

interface DrawerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  close: () => void;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

export const useMobileNavDrawer = () => {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("Missing MobileNavDrawerProvider");
  return ctx;
};

export const MobileNavDrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DrawerContext.Provider value={{ isOpen, setIsOpen, close: () => setIsOpen(false) }}>
      {children}
    </DrawerContext.Provider>
  );
};
