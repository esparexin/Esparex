import { usePathname } from "next/navigation";
import {
  Button,
  Z_INDEX,
} from "@esparex/ui";
import {
  Info,
  CheckCircle,
  Edit2,
  TrendingUp,
  Trash2,
  MessageCircle,
  Phone,
  Sparkles,
} from "@/icons/IconRegistry";
import { ActionBarVariant } from "@/lib/logic/bottomBarActions";
import { getMobileChromePolicy } from "@/lib/mobile/chromePolicy";

function SpotlightOrBoostButton({ isSpotlight, onPromoteClick }: { isSpotlight: boolean; onPromoteClick?: () => void }) {
  if (isSpotlight) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5 h-11 px-1 text-tiny font-bold rounded-xl bg-amber-50 border border-amber-200 text-amber-800 select-none">
        <Sparkles className="h-4 w-4 text-amber-600 fill-amber-500" />
        Spotlight
      </div>
    );
  }
  return (
    <Button variant="outline" className="flex flex-col gap-1 h-11 text-xs rounded-xl bg-violet-600 hover:bg-violet-700 border-none text-white" onClick={onPromoteClick}>
      <TrendingUp className="h-5 w-5" />
      Boost
    </Button>
  );
}

interface ListingBottomActionsProps {
  variant: ActionBarVariant;
  isSpotlight?: boolean;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  onMarkSoldClick?: () => void;
  onPromoteClick?: () => void;
  onAnalyticsClick?: () => void;
  onChatClick?: () => void;
  onRevealPhone?: () => void;
  isPhoneLoading?: boolean;
  revealedPhone?: string | null;
  phoneMessage?: string | null;
  isChatLocked?: boolean;
}

export function ListingBottomActions({
  variant,
  isSpotlight = false,
  onEditClick,
  onDeleteClick,
  onMarkSoldClick,
  onPromoteClick,
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
  if (variant === "owner" || variant === "sold-owner" || variant === "pending-owner") {
    // If ad is sold, show only sold status
    if (variant === "sold-owner") {
      return (
        <div className="md:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t-2 border-green-600 shadow-lg z-40">
            <div className="px-4 pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                <div className="text-center">
                  <p className="font-semibold text-green-600">Ad Marked as Sold</p>
                  <p className="text-caption text-foreground-subtle mt-0.5">
                    This ad is now archived and removed from listings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (variant === "pending-owner") {
      return (
        <div className="md:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-40">
            <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200">
              <p className="text-caption text-center text-amber-700">
                <Info className="h-3 w-3 inline mr-1" />
                Waiting for admin approval
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-caption"
                onClick={onEditClick}
              >
                <Edit2 className="h-5 w-5" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-11 text-caption text-destructive border-destructive/20 hover:bg-destructive/10"
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
      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border shadow-lg z-40">
          {/* Owner Notice */}
          <div className="px-4 py-1.5 bg-green-50 border-b border-green-200">
            <p className="text-caption text-center text-green-700">
              <Info className="h-3 w-3 inline mr-1" />
              You&apos;re viewing your active listing
            </p>
          </div>

          {/* Action Bar */}
          <div className="grid grid-cols-3 gap-1.5 px-2 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {/* Edit */}
            <Button
              variant="outline"
              className="flex flex-col gap-1 h-11 text-caption rounded-xl border-border text-foreground-tertiary"
              onClick={onEditClick}
            >
              <Edit2 className="h-5 w-5" />
              Edit
            </Button>

            {/* Mark Sold */}
            <Button
              variant="outline"
              className="flex flex-col gap-1 h-11 text-caption rounded-xl border-border text-foreground-tertiary"
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

            {/* Promote / Spotlight Applied */}
            <SpotlightOrBoostButton isSpotlight={isSpotlight} onPromoteClick={onPromoteClick} />
          </div>
        </div>
      </div>
    );
  }

  // Visitor Action Bar
  if (variant === "visitor") {
    const showPhoneAction = Boolean(onRevealPhone);
    const showChatAction = Boolean(onChatClick) && !isChatLocked;
    const hasVisitorActions = showPhoneAction || showChatAction;

    return (
      <div className="md:hidden">
        <div 
          className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border shadow-lg"
          style={{ zIndex: Z_INDEX.listingBottomActions }}
        >
          <div className={`grid gap-2 px-3 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] ${showPhoneAction && showChatAction ? "grid-cols-2" : "grid-cols-1"}`}>
            {showPhoneAction ? (
              <Button
                variant="outline"
                onClick={onRevealPhone}
                disabled={isPhoneLoading}
                aria-label={revealedPhone ? `Call ${revealedPhone}` : "Reveal seller phone number"}
                className="w-full h-11 rounded-xl font-semibold gap-2 border-border text-foreground-secondary hover:bg-muted"
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
              <p className={`${hasVisitorActions ? "col-span-full" : ""} px-1 text-caption leading-4 text-foreground-subtle`}>
                {chatLockedMessage}
              </p>
            ) : null}
            {showPhoneMessage && (
              <p className={`${hasVisitorActions ? "col-span-full" : ""} px-1 text-caption leading-4 text-foreground-subtle`}>
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
