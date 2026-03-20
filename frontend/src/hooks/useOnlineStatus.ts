"use client";
import { useSyncExternalStore } from "react";

type Subscriber = () => void;

type Unsubscribe = () => void;

const subscribe = (callback: Subscriber): Unsubscribe => {
  if (typeof window === "undefined") return () => undefined;

  const handler = () => callback();
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);

  return () => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
};

const getSnapshot = () => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

const getServerSnapshot = () => true;

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
