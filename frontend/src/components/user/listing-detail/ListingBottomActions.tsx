import { usePathname } from "next/navigation";
import { Button } from "../../ui/button";
import {
  Info,
  CheckCircle,
  Edit2,
  TrendingUp,
  Trash2,
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
}

export function ListingBottomActions({
  variant,
  onEditClick,
  onDeleteClick,
  onMarkSoldClick,
  onPromoteClick,
  onAnalyticsClick,
}: ListingBottomActionsProps) {
  const pathname = usePathname();
  const policy = getMobileChromePolicy(pathname);

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
            <div className="fixed bottom-0 left-0 right-0 bg-green-50 border-t-2 border-green-600 shadow-lg z-40 safe-area-bottom">
              <div className="p-4">
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
          <div className="fixed bottom-20 left-0 right-0 px-4 py-2 bg-amber-50 border-t border-amber-200 z-40">
            <p className="text-xs text-center text-amber-700">
              <Info className="h-3 w-3 inline mr-1" />
              Waiting for admin approval
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 safe-area-bottom">
            <div className="grid grid-cols-2 gap-2 p-3">
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-2 text-xs"
                onClick={onEditClick}
              >
                <Edit2 className="h-5 w-5" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-2 text-xs text-red-700 border-red-200 hover:bg-red-50"
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
          <div className="fixed bottom-20 left-0 right-0 px-4 py-2 bg-green-50 border-t border-green-200 z-40">
            <p className="text-xs text-center text-green-700">
              <Info className="h-3 w-3 inline mr-1" />
              You're viewing your active listing
            </p>
          </div>

          {/* Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 safe-area-bottom">
            <div className="grid grid-cols-3 gap-2 p-3">
              {/* Edit */}
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-2 text-xs"
                onClick={onEditClick}
              >
                <Edit2 className="h-5 w-5" />
                Edit
              </Button>

              {/* Mark Sold */}
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-2 text-xs"
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
                className="flex flex-col gap-1 h-auto py-2 text-xs bg-purple-50 border-purple-300 text-purple-700"
                onClick={onPromoteClick}
              >
                <TrendingUp className="h-5 w-5" />
                Boost
              </Button>
            </div>

            {/* Analytics Quick View */}
            <button
              onClick={onAnalyticsClick}
              className="w-full py-2 text-xs text-center text-gray-600 border-t hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <span className="font-medium">View Analytics</span> • Tap for detailed stats
            </button>
          </div>
        </div>

        {/* Desktop - Owner Action Bar - REMOVED (no fixed bottom bar on desktop for owners) */}
      </>
    );
  }

  // Visitor Action Bar
  return null;
}
