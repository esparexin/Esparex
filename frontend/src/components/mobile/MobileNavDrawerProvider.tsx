"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

  // Body scroll lock strategy
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  return (
    <DrawerContext.Provider value={{ isOpen, setIsOpen, close: () => setIsOpen(false) }}>
      {children}
    </DrawerContext.Provider>
  );
};
