import { usePathname } from "next/navigation";
import { Button } from "../../ui/button";
import {
  Info,
  CheckCircle,
  Edit2,
  TrendingUp,
  Trash2,
  MessageCircle,
  Phone,
} from "lucide-react";
import { ActionBarVariant } from "@/lib/logic/bottomBarActions";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

interface ListingBottomActionsProps {
  variant: ActionBarVariant;
  // Owner props
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onMarkSoldClick?: () => void;
  onPromoteClick?: () => void;
  onAnalyticsClick?: () => void;
  // Visitor props
  onChatClick?: () => void;
  onRevealPhone?: () => void;
  isPhoneLoading?: boolean;
  revealedPhone?: string | null;
  phoneMessage?: string | null;
  isChatLocked?: boolean;
}

export function ListingBottomActions({
  variant,
  onEditClick,
  onDeleteClick,
  onMarkSoldClick,
  onPromoteClick,
  onAnalyticsClick,
  onChatClick,
  onRevealPhone,
  isPhoneLoading,
  revealedPhone,
  phoneMessage,
  isChatLocked,
}: ListingBottomActionsProps) {
  const pathname = usePathname();
  const policy = getMobileChromePolicy(pathname);
  const phoneButtonLabel = isPhoneLoading
    ? "Loading..."
    : (revealedPhone || "Show number");
  const showPhoneMessage = Boolean(phoneMessage);
  const chatLockedMessage = "This listing is no longer accepting messages";

  if (variant === "hidden" || !policy.showContextActionBar) {
    return null;
  }


  // Owner Action Bar
  if (variant === "owner" || variant === "sold-owner" || variant === "pending-owner") {
    // If ad is sold, show only sold status
    if (variant === "sold-owner") {
      return (
        <>
          {/* Mobile - Sold Status Bar */}
          <div className="md:hidden">
            <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t-2 border-green-600 shadow-lg z-40">
              <div className="px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="text-center">
                    <p className="font-semibold text-green-600">Ad Marked as Sold</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This ad is now archived and removed from listings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop - NO fixed bottom bar (removed as per request) */}
        </>
      );
    }

    if (variant === "pending-owner") {
      return (
        <div className="md:hidden">
          <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 px-4 py-2 bg-amber-50 border-t border-amber-200 z-40">
            <p className="text-xs text-center text-amber-700">
              <Info className="h-3 w-3 inline mr-1" />
              Waiting for admin approval
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
            <div className="grid grid-cols-2 gap-2 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-xs"
                onClick={onEditClick}
              >
                <Edit2 className="h-5 w-5" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-xs text-red-700 border-red-200 hover:bg-red-50"
                onClick={onDeleteClick}
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // If ad is not sold, show action buttons
    return (
      <>
        {/* Mobile - Owner Action Bar */}
        <div className="md:hidden">
          {/* Owner Notice */}
          <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 px-4 py-2 bg-green-50 border-t border-green-200 z-40">
            <p className="text-xs text-center text-green-700">
              <Info className="h-3 w-3 inline mr-1" />
              You're viewing your active listing
            </p>
          </div>

          {/* Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] z-40">
            <div className="grid grid-cols-3 gap-1.5 px-2 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {/* Edit */}
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-xs rounded-xl border-slate-200 text-foreground-tertiary"
                onClick={onEditClick}
              >
                <Edit2 className="h-5 w-5" />
                Edit
              </Button>

              {/* Mark Sold */}
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-xs rounded-xl border-slate-200 text-foreground-tertiary"
                onClick={onMarkSoldClick}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
                Sold
              </Button>

              {/* Promote */}
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-xs rounded-xl bg-violet-600 hover:bg-violet-700 border-none text-white"
                onClick={onPromoteClick}
              >
                <TrendingUp className="h-5 w-5" />
                Boost
              </Button>
            </div>

            {/* Analytics Quick View */}
            <button
              onClick={onAnalyticsClick}
              className="w-full py-2 text-xs text-center text-foreground-subtle border-t border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <span className="font-medium text-muted-foreground">View Analytics</span> · Tap for detailed stats
            </button>
          </div>
        </div>

        {/* Desktop - Owner Action Bar - REMOVED (no fixed bottom bar on desktop for owners) */}
      </>
    );
  }

  // Visitor Action Bar
  if (variant === "visitor") {
    const showPhoneAction = Boolean(onRevealPhone);
    const showChatAction = Boolean(onChatClick) && !isChatLocked;
    const hasVisitorActions = showPhoneAction || showChatAction;

    return (
      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] z-40">
          <div className={`grid gap-2 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${showPhoneAction && showChatAction ? "grid-cols-2" : "grid-cols-1"}`}>
            {showPhoneAction ? (
              <Button
                variant="outline"
                onClick={onRevealPhone}
                disabled={isPhoneLoading}
                aria-label={revealedPhone ? `Call ${revealedPhone}` : "Reveal seller phone number"}
                className="w-full h-11 rounded-xl font-semibold gap-2 border-slate-200 text-foreground-secondary hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" />
                <span className="min-w-0 truncate">{phoneButtonLabel}</span>
              </Button>
            ) : null}
            {showChatAction ? (
              <Button
                onClick={onChatClick}
                aria-label="Chat with seller"
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold gap-2 shadow-md shadow-blue-100 transition-all"
              >
                <MessageCircle className="h-5 w-5" />
                Chat
              </Button>
            ) : null}
            {isChatLocked ? (
              <p className={`${hasVisitorActions ? "col-span-full" : ""} px-1 text-xs leading-4 text-muted-foreground`}>
                {chatLockedMessage}
              </p>
            ) : null}
            {showPhoneMessage && (
              <p className={`${hasVisitorActions ? "col-span-full" : ""} px-1 text-xs leading-4 text-muted-foreground`}>
                {phoneMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
