"use client";

import React from "react";
import { ChevronLeft, Settings as SettingsIcon } from "@/icons/IconRegistry";
import { PROFILE_TAB_ITEMS, type ProfileTabValue } from "@/config/navigation";
import { ACCOUNT_COPY } from "@/config/copy/account";
import { Button } from "@esparex/ui";

interface AccountHeaderProps {
  /** Passed when rendering the mobile sticky context — drives tab title and back button */
  activeTab?: ProfileTabValue;
  /** Called when the back button is pressed on mobile */
  onBackToMenu?: () => void;
  /** Optional element rendered on the top right corner of the mobile sticky header */
  rightElement?: React.ReactNode;
  /** Optional extra class for the desktop page-header wrapper */
  className?: string;
}

/**
 * Single responsive account header.
 *
 * Mobile (< md):  Sticky top bar with back-chevron, active tab title, and optional rightElement slot.
 * Desktop (≥ md): Page-level heading block with icon, title, and subtitle.
 */
export function AccountHeader({
  activeTab,
  onBackToMenu,
  rightElement,
  className = "",
}: AccountHeaderProps) {
  // ── Mobile header state ──────────────────────────────────────────────────
  const isMenuTab = activeTab === "more" || !activeTab;
  const currentTabItem = PROFILE_TAB_ITEMS.find((item) => item.value === activeTab);
  const mobileTitle = isMenuTab
    ? ACCOUNT_COPY.title
    : currentTabItem?.label ?? "Account";

  return (
    <>
      {/* MOBILE: Sticky contextual header (hidden on md+) */}
      <header
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border flex md:hidden items-center justify-between px-3 h-14 w-full text-foreground"
        aria-label="Account section header"
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isMenuTab && onBackToMenu && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBackToMenu}
              aria-label="Back to Account Menu"
              className="rounded-xl text-slate-700 hover:bg-slate-100 shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {/* ui-guard-ignore: multiple-h1 Responsive sibling — mobile-only h1, hidden md:block counterpart below */}
          <h1 className="account-page-title truncate">
            {mobileTitle}
          </h1>
        </div>

        {rightElement && (
          <div className="flex items-center shrink-0 ml-2">
            {rightElement}
          </div>
        )}
      </header>

      {/* DESKTOP: Page-level heading block (hidden below md, container-aligned) */}
      <div className={`hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-2xl shadow-sm">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            {/* ui-guard-ignore: multiple-h1 Responsive sibling — desktop-only h1 inside hidden md:block wrapper */}
            <h1 className="account-page-title">{ACCOUNT_COPY.title}</h1>
            <p className="account-body-text mt-0.5">{ACCOUNT_COPY.subtitle}</p>
          </div>
        </div>
      </div>
    </>
  );
}
