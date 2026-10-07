"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { EntitySearchOptionsList } from "./EntitySearchOptionsList";
import type { DropdownRect } from "@/hooks/useDropdownPosition";

/**
 * DesktopDropdownPortal — portalled dropdown for EntitySearchCombobox.
 *
 * Root cause (F-Z7): the dropdown was absolutely positioned inside the
 * container, getting clipped by overflow-hidden dialog variants. Portalled
 * to document.body with fixed positioning.
 *
 * Extracted from EntitySearchCombobox to keep the component within the
 * file-size ratchet.
 */
export interface DesktopDropdownPortalProps<T> {
  listboxId: string;
  dropdownRect: DropdownRect;
  items: T[];
  loading: boolean;
  activeIndex: number;
  emptyMessage: string;
  sanitizedTitle: string;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  renderItem?: (item: T, isSelected: boolean) => ReactNode;
  onSelect: (item: T) => void;
}

export function DesktopDropdownPortal<T>({
  listboxId,
  dropdownRect,
  items,
  loading,
  activeIndex,
  emptyMessage,
  sanitizedTitle,
  getLabel,
  getId,
  renderItem,
  onSelect,
}: DesktopDropdownPortalProps<T>) {
  return createPortal(
    <div
      id={listboxId}
      role="listbox"
      style={{
        position: "fixed",
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: dropdownRect.width,
        zIndex: 99999,
      }}
      className="max-h-60 bg-popover border border-border rounded-xl shadow-xl overflow-y-auto p-1.5 overscroll-contain touch-pan-y"
    >
      <EntitySearchOptionsList
        items={items}
        loading={loading}
        activeIndex={activeIndex}
        isMobileView={false}
        emptyMessage={emptyMessage}
        sanitizedTitle={sanitizedTitle}
        getLabel={getLabel}
        getId={getId}
        renderItem={renderItem}
        onSelect={onSelect}
      />
    </div>,
    document.body
  );
}