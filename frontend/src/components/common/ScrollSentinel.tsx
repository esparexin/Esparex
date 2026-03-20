"use client";

import { useEffect, useRef } from "react";

/**
 * ScrollSentinel: A 1px zero-overhead intersection observer.
 * Toggles a global 'data-scrolled' attribute on the document element
 * to drive CSS-only animations/styles without React renders.
 */
export function ScrollSentinel() {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // When NOT intersecting, it means we have scrolled down
          document.documentElement.dataset.scrolled = (!entry.isIntersecting).toString();
        }
      },
      { threshold: [1.0], rootMargin: "0px 0px 0px 0px" }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={sentinelRef} 
      aria-hidden="true" 
      className="absolute top-0 left-0 w-full h-[1px] pointer-events-none opacity-0"
    />
  );
}
