import { useState, useRef, useCallback } from "react";

const DRAG_CLOSE_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.4;

export function useDrawerDragGesture(onClose: () => void) {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const resetDrag = useCallback(() => {
    setDragOffsetY(0);
    setIsDragging(false);
    touchStartYRef.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0]?.clientY;
    if (typeof currentY !== "number") return;
    const diff = currentY - touchStartYRef.current;
    setDragOffsetY(diff > 0 ? diff : 0);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartYRef.current === null) return;
    const elapsed = Date.now() - touchStartTimeRef.current;
    const velocity = dragOffsetY / Math.max(1, elapsed);
    if (dragOffsetY >= DRAG_CLOSE_THRESHOLD || (dragOffsetY > 25 && velocity > VELOCITY_THRESHOLD)) {
      onClose();
    }
    resetDrag();
  }, [dragOffsetY, onClose, resetDrag]);

  return {
    dragOffsetY,
    isDragging,
    resetDrag,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
