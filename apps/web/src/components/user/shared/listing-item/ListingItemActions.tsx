"use client";

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
  Button,
  StatusChip,
} from "@esparex/ui";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@esparex/ui";

interface ListingItemActionsProps {
  status: string;
  title: string;
  detailHref?: string;
  editHref: string;
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
            <StatusChip status={status} />
          </div>
        )}

        {hasOverflowItems ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="More actions"
                className={cn(
                  "size-7 md:size-6 flex items-center justify-center cursor-pointer p-0",
                  "rounded text-muted-foreground",
                  "hover:text-foreground hover:bg-muted",
                  "relative before:absolute before:-inset-2 before:content-['']",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                )}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="min-w-[140px] p-1 shadow-md border border-border bg-card"
            >
              {showMarkSold && (
                <DropdownMenuItem
                  onClick={onMarkSold}
                  className="text-success-dark focus:text-success-dark focus:bg-success/10 cursor-pointer text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <CheckSquare className="h-3 w-3 mr-1.5 shrink-0" />
                  Mark as Sold
                </DropdownMenuItem>
              )}
              {showDeactivate && (
                <DropdownMenuItem
                  onClick={onDeactivate}
                  className="text-warning-dark focus:text-warning-dark focus:bg-warning/10 cursor-pointer text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <PowerOff className="h-3 w-3 mr-1.5 shrink-0" />
                  Deactivate
                </DropdownMenuItem>
              )}
              {showActivate && (
                <DropdownMenuItem
                  onClick={onActivate}
                  className="text-primary focus:text-primary focus:bg-primary/10 cursor-pointer text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <Power className="h-3 w-3 mr-1.5 shrink-0" />
                  Activate
                </DropdownMenuItem>
              )}
              {showBoost && (
                <DropdownMenuItem
                  onClick={onBoost}
                  className="text-warning-dark focus:text-warning-dark focus:bg-warning/10 cursor-pointer text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <Sparkles className="h-3 w-3 mr-1.5 shrink-0 text-warning" />
                  Apply Boost / Spotlight
                </DropdownMenuItem>
              )}
              {showRenew && (
                <DropdownMenuItem
                  onClick={onRenew}
                  className="text-primary focus:text-primary focus:bg-primary/10 cursor-pointer text-tiny font-medium py-1 px-2 flex items-center"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5 shrink-0" />
                  Renew
                </DropdownMenuItem>
              )}
              {(showMarkSold || showDeactivate || showActivate || showRenew) &&
                showDelete && <DropdownMenuSeparator className="my-1" />}
              {detailHref && isActive && (
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
                  className="cursor-pointer text-tiny font-medium py-1 px-2 flex items-center text-foreground"
                >
                  <Share2 className="h-3 w-3 mr-1.5 shrink-0" />
                  Share
                </DropdownMenuItem>
              )}
              {showDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-tiny font-medium py-1 px-2 flex items-center"
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
          <span className="inline-flex items-center gap-1 bg-warning/10 text-warning-dark border border-warning/30 text-tiny font-bold px-2 py-1 rounded-md shadow-2xs shrink-0">
            <Sparkles className="h-3 w-3 text-warning fill-warning" />
            Spotlight
          </span>
        ) : onBoost && isActive ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBoost}
            aria-label="Promote listing"
            title="Promote / Boost Ad"
            className="size-8 md:size-7 flex items-center justify-center shrink-0 rounded-md border-warning/30 bg-warning/10 text-warning-dark hover:bg-warning/20 hover:border-warning transition-colors shadow-2xs cursor-pointer p-0 focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-1"
          >
            <Zap className="h-3.5 w-3.5 text-warning fill-warning shrink-0" />
          </Button>
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
