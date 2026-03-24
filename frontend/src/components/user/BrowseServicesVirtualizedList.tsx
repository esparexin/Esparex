"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { Service } from "@/lib/api/user/services";
import { BrowseServicesCard } from "@/components/user/BrowseServicesCard";

interface BrowseServicesVirtualizedListProps {
  services: Service[];
  view: "grid" | "list";
}

const LIST_ITEM_HEIGHT = 180;
const GRID_ITEM_HEIGHT = 280;

export default function BrowseServicesVirtualizedList({
  services,
  view,
}: BrowseServicesVirtualizedListProps) {
  const [lanes, setLanes] = useState(4);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === "list") {
      setLanes(1);
      return;
    }

    const updateLanes = () => {
      if (window.innerWidth >= 1024) setLanes(4);
      else if (window.innerWidth >= 768) setLanes(3);
      else setLanes(2);
    };

    updateLanes();
    window.addEventListener("resize", updateLanes);
    return () => window.removeEventListener("resize", updateLanes);
  }, [view]);

  const rowVirtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (view === "list" ? LIST_ITEM_HEIGHT : GRID_ITEM_HEIGHT),
    overscan: 5,
    lanes: view === "list" ? 1 : lanes,
  });

  return (
    <div ref={parentRef} className="max-h-[800px] overflow-auto custom-scrollbar w-full pb-8">
      <div
        className={
          view === "list"
            ? "flex flex-col gap-3"
            : "grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-3 lg:grid-cols-4"
        }
      >
        {rowVirtualizer.getVirtualItems().length > 0 &&
          Array.from({ length: rowVirtualizer.getVirtualItems()[0]?.index ?? 0 }).map((_, i) => (
            <div
              key={`spacer-before-${i}`}
              style={{ height: view === "list" ? LIST_ITEM_HEIGHT : GRID_ITEM_HEIGHT }}
            />
          ))}

        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const service = services[virtualRow.index];
          if (!service) return null;
          return <BrowseServicesCard key={service.id} service={service} />;
        })}

        {rowVirtualizer.getVirtualItems().length > 0 &&
          Array.from({
            length: Math.max(
              0,
              services.length -
                1 -
                (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.index ?? 0),
            ),
          }).map((_, i) => (
            <div
              key={`spacer-after-${i}`}
              style={{ height: view === "list" ? LIST_ITEM_HEIGHT : GRID_ITEM_HEIGHT }}
            />
          ))}
      </div>
    </div>
  );
}
