"use client";

import React from "react";
import Link from "next/link";
import {
  Edit2,
  Trash2,
  RefreshCw,
  CheckSquare,
  PowerOff,
  Power,
  MoreVertical,
  Share2,
  Sparkles,
  Zap,
} from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ListingItemActionsProps {
  status: string;
  title: string;
  detailHref?: string;
  editHref: string;
  getStatusBadge: (status: string) => React.ReactNode;
  showStatusBadge?: boolean;
  showEdit: boolean;
  showDeactivate: boolean;
  showActivate: boolean;
  showMarkSold: boolean;
  showRenew: boolean;
  showBoost: boolean;
  showDelete: boolean;
  hasOverflowItems: boolean;
  isSpotlight: boolean;
  isActive: boolean;
  onDelete: () => void;
  onRenew?: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  onMarkSold?: () => void;
  onBoost?: () => void;
}

export function ListingItemActions({
  status,
  title,
  detailHref,
  editHref,
  getStatusBadge,
  showStatusBadge = true,
  showEdit,
  showDeactivate,
  showActivate,
  showMarkSold,
  showRenew,
  showBoost,
  showDelete,
  hasOverflowItems,
  isSpotlight,
  isActive,
  onDelete,
  onRenew,
  onDeactivate,
  onActivate,
  onMarkSold,
  onBoost,
}: ListingItemActionsProps) {
  return (
    <div className="shrink-0 min-w-[80px] self-center flex flex-col items-end gap-1.5">
      {/* ── Row A: Badge + ⋮ ── */}
      <div
        className={cn(
          "w-full flex items-center gap-1",
          showStatusBadge ? "justify-between" : "justify-end"
        )}
      >
        {showStatusBadge && (
          <div className="[&>*]:!text-tiny [&>*]:!font-semibold [&>*]:!px-1.5 [&>*]:!py-[3px] [&>*]:!rounded [&>*]:!leading-none shrink-0">
            {getStatusBadge(status)}
          </div>
        )}

        {hasOverflowItems ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More actions"
                className={cn(
                  "h-6 w-6 flex items-center justify-center cursor-pointer",
                  "rounded text-muted-foreground",
                  "hover:text-foreground hover:bg-muted",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                )}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="min-w-[140px] p-1 shadow-md border border-border bg-card"
            >
              {showMarkSold && (
                <DropdownMenuItem
                  onClick={onMarkSold}
                  className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <CheckSquare className="h-3 w-3 mr-1.5 shrink-0" />
                  Mark as Sold
                </DropdownMenuItem>
              )}
              {showDeactivate && (
                <DropdownMenuItem
                  onClick={onDeactivate}
                  className="text-amber-700 focus:text-amber-700 focus:bg-amber-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <PowerOff className="h-3 w-3 mr-1.5 shrink-0" />
                  Deactivate
                </DropdownMenuItem>
              )}
              {showActivate && (
                <DropdownMenuItem
                  onClick={onActivate}
                  className="text-primary focus:text-primary focus:bg-primary/10 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <Power className="h-3 w-3 mr-1.5 shrink-0" />
                  Activate
                </DropdownMenuItem>
              )}
              {showBoost && (
                <DropdownMenuItem
                  onClick={onBoost}
                  className="text-amber-700 focus:text-amber-700 focus:bg-amber-50 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <Sparkles className="h-3 w-3 mr-1.5 shrink-0 text-amber-500" />
                  Apply Boost / Spotlight
                </DropdownMenuItem>
              )}
              {showRenew && (
                <DropdownMenuItem
                  onClick={onRenew}
                  className="text-primary focus:text-primary focus:bg-primary/10 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5 shrink-0" />
                  Renew
                </DropdownMenuItem>
              )}
              {(showMarkSold || showDeactivate || showActivate || showRenew) &&
                showDelete && <DropdownMenuSeparator className="my-1" />}
              {detailHref && (
                <DropdownMenuItem
                  onClick={() => {
                    if (typeof window !== "undefined" && navigator.share) {
                      void navigator.share({ title, url: detailHref });
                    } else {
                      void navigator.clipboard.writeText(
                        window.location.origin + detailHref
                      );
                    }
                  }}
                  className="cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center text-foreground"
                >
                  <Share2 className="h-3 w-3 mr-1.5 shrink-0" />
                  Share
                </DropdownMenuItem>
              )}
              {showDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer !text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <Trash2 className="h-3 w-3 mr-1.5 shrink-0" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : showStatusBadge ? (
          <span className="h-6 w-6 shrink-0" aria-hidden="true" />
        ) : null}
      </div>

      {/* ── Row B: Direct Action Shortcut (Spotlight / Boost + Edit) ── */}
      <div className="flex items-center gap-1.5 justify-end w-full">
        {isSpotlight && isActive ? (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-300/80 text-tiny font-bold px-2 py-1 rounded-md shadow-2xs shrink-0">
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-400" />
            Spotlight
          </span>
        ) : onBoost && isActive ? (
          <button
            type="button"
            onClick={onBoost}
            aria-label="Promote listing"
            title="Promote / Boost Ad"
            className="h-8 w-8 md:h-7 md:w-7 flex items-center justify-center shrink-0 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-400 shrink-0" />
          </button>
        ) : null}

        {showEdit ? (
          <Link
            href={editHref}
            aria-label="Edit listing"
            className="h-8 w-8 md:h-7 md:w-7 flex items-center justify-center shrink-0 rounded-md border border-border text-foreground-subtle hover:text-foreground hover:bg-muted hover:border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
