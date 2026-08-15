"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X } from "@/icons/IconRegistry";
import { getRemovePhotoAriaLabel } from "./uploadHelpers";

export interface ListingImageTileItem {
  id?: string | number;
  preview: string;
}

interface ListingImageTileProps {
  img: ListingImageTileItem;
  index: number;
  totalImages: number;
  disabled?: boolean;
  onReorder?: (startIndex: number, endIndex: number) => void;
  onRemove: (id: string | number) => void;
  onSetMain?: (index: number) => void;
  firstImageBadgeLabel: string;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
  setDraggedIndex: (index: number | null) => void;
  setDropTargetIndex: (index: number | null) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
}

export function ListingImageTile({
  img,
  index,
  totalImages,
  disabled,
  onReorder,
  onRemove,
  onSetMain,
  firstImageBadgeLabel,
  draggedIndex,
  dropTargetIndex,
  setDraggedIndex,
  setDropTargetIndex,
  onDrop,
}: ListingImageTileProps) {
  return (
    <div
      draggable={Boolean(onReorder && !disabled)}
      onDragStart={(e) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
      }}
      onDragOver={(e) => {
        if (onReorder) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (draggedIndex !== index) {
            setDropTargetIndex(index);
          }
        }
      }}
      onDragLeave={() => {
        if (dropTargetIndex === index) {
          setDropTargetIndex(null);
        }
      }}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={() => {
        setDraggedIndex(null);
        setDropTargetIndex(null);
      }}
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden border bg-muted group shadow-2xs transition-all duration-200",
        onReorder && !disabled && "cursor-grab active:cursor-grabbing",
        draggedIndex === index && "opacity-40 scale-90 border-primary border-dashed",
        dropTargetIndex === index && "ring-2 ring-primary ring-offset-2 scale-105",
        "border-border"
      )}
    >
      <Image
        src={img.preview}
        alt={`Photo ${index + 1}`}
        fill
        unoptimized
        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
        className="object-cover pointer-events-none"
      />

      {/* Mobile Always-Visible Remove Button / Desktop Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-1.5 pointer-events-auto">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Remove this photo?")) {
                onRemove(img.id ?? index);
              }
            }}
            aria-label={getRemovePhotoAriaLabel(index, totalImages)}
            className="p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer shadow-xs"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        {onSetMain && index !== 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetMain(index);
            }}
            className="w-full py-1 text-3xs font-bold text-white bg-black/70 rounded backdrop-blur-xs hover:bg-primary transition-colors uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white touch-manipulation cursor-pointer"
          >
            Make Cover
          </button>
        )}
      </div>

      {index === 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-primary/95 py-0.5 text-center text-3xs font-bold text-white uppercase tracking-wider pointer-events-none shadow-xs backdrop-blur-xs">
          {firstImageBadgeLabel}
        </div>
      )}
    </div>
  );
}
