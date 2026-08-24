import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@esparex/ui";
import type { Listing } from "@/lib/api/user/listings";
import { SoldReasonDialog, type SoldReason } from "@/components/user/shared/SoldReasonDialog";
import { BoostPlanDialog } from "@/components/user/BoostPlanDialog";

interface MyListingsDialogsProps {
  // Delete
  adToDelete: Listing | null;
  isDeleteAdOpen: boolean;
  setIsDeleteAdOpen: (open: boolean) => void;
  confirmDeleteAd: () => Promise<void>;

  // Deactivate
  adToDeactivate: Listing | null;
  isDeactivateOpen: boolean;
  setIsDeactivateOpen: (open: boolean) => void;
  confirmDeactivate: () => Promise<void>;

  // Activate
  adToActivate: Listing | null;
  isActivateOpen: boolean;
  setIsActivateOpen: (open: boolean) => void;
  confirmActivate: () => Promise<void>;

  // Mark Ad Sold
  isSoldOpen: boolean;
  setIsSoldOpen: (open: boolean) => void;
  soldReason: SoldReason | null;
  setSoldReason: (reason: SoldReason | null) => void;
  isSelling: boolean;
  confirmSold: () => Promise<void>;

  // Mark Spare Sold
  isSparesSoldOpen: boolean;
  setIsSparesSoldOpen: (open: boolean) => void;
  sparesSoldReason: SoldReason | null;
  setSparesSoldReason: (reason: SoldReason | null) => void;
  isSpareSelling: boolean;
  confirmSoldSpare: () => Promise<void>;

  // Boost
  boostAd: Listing | null;
  isBoostOpen: boolean;
  setIsBoostOpen: (open: boolean) => void;
  onBoostPlanPurchased: () => void;
}

export function MyListingsDialogs({
  adToDelete,
  isDeleteAdOpen,
  setIsDeleteAdOpen,
  confirmDeleteAd,
  adToDeactivate,
  isDeactivateOpen,
  setIsDeactivateOpen,
  confirmDeactivate,
  adToActivate,
  isActivateOpen,
  setIsActivateOpen,
  confirmActivate,
  isSoldOpen,
  setIsSoldOpen,
  soldReason,
  setSoldReason,
  isSelling,
  confirmSold,
  isSparesSoldOpen,
  setIsSparesSoldOpen,
  sparesSoldReason,
  setSparesSoldReason,
  isSpareSelling,
  confirmSoldSpare,
  boostAd,
  isBoostOpen,
  setIsBoostOpen,
  onBoostPlanPurchased,
}: MyListingsDialogsProps) {
  return (
    <>
      <AlertDialog open={isDeleteAdOpen} onOpenChange={setIsDeleteAdOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive &ldquo;<strong>{adToDelete?.title}</strong>&rdquo;. It will no longer be visible to buyers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAd} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;<strong>{adToDeactivate?.title}</strong>&rdquo; will be hidden from the public. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-amber-600 hover:bg-amber-700 text-white">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isActivateOpen} onOpenChange={setIsActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;<strong>{adToActivate?.title}</strong>&rdquo; will be sent back to moderation for review before becoming live.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SoldReasonDialog
        open={isSoldOpen}
        onOpenChange={setIsSoldOpen}
        description="How was this ad sold?"
        inputName="soldReason"
        selectedReason={soldReason}
        onReasonChange={setSoldReason}
        isSubmitting={isSelling}
        onConfirm={confirmSold}
      />

      <SoldReasonDialog
        open={isSparesSoldOpen}
        onOpenChange={setIsSparesSoldOpen}
        description="How was this spare part sold?"
        inputName="sparesSoldReason"
        selectedReason={sparesSoldReason}
        onReasonChange={setSparesSoldReason}
        isSubmitting={isSpareSelling}
        onConfirm={confirmSoldSpare}
      />

      {boostAd && (
        <BoostPlanDialog
          open={isBoostOpen}
          onOpenChange={setIsBoostOpen}
          adId={boostAd.id}
          adTitle={boostAd.title}
          isSpotlight={Boolean(boostAd.isSpotlight)}
          isBoosted={Boolean(boostAd.isBoosted)}
          onPlanPurchased={onBoostPlanPurchased}
        />
      )}
    </>
  );
}
