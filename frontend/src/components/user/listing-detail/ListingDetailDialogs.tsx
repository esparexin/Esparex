"use client";

import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";

import { type Ad } from "@/schemas/ad.schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ReportAdDialog = dynamic(
  () => import("../ReportAdDialog").then((mod) => mod.ReportAdDialog),
  { ssr: false }
);
const BoostPlanDialog = dynamic(
  () => import("../BoostPlanDialog").then((mod) => mod.BoostPlanDialog),
  { ssr: false }
);
const SoldOutDialog = dynamic(
  () => import("../SoldOutDialog").then((mod) => mod.SoldOutDialog),
  { ssr: false }
);

interface ListingDetailDialogsProps {
  ad: Ad;
  showReportDialog: boolean;
  setShowReportDialog: (value: boolean) => void;
  showBoostDialog: boolean;
  setShowBoostDialog: (value: boolean) => void;
  showSoldDialog: boolean;
  setShowSoldDialog: (value: boolean) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (value: boolean) => void;
  showAnalyticsDialog: boolean;
  setShowAnalyticsDialog: (value: boolean) => void;
  analyticsSummary: {
    total: number;
    unique: number;
    lastViewedAt?: string | null;
  } | null;
  isAnalyticsLoading: boolean;
  isDeleting: boolean;
  onDeleteConfirm: () => void | Promise<void>;
  onSoldConfirm: (platform: string) => Promise<boolean>;
  onListingUnavailable: () => void;
}

export function ListingDetailDialogs({
  ad,
  showReportDialog,
  setShowReportDialog,
  showBoostDialog,
  setShowBoostDialog,
  showSoldDialog,
  setShowSoldDialog,
  showDeleteDialog,
  setShowDeleteDialog,
  showAnalyticsDialog,
  setShowAnalyticsDialog,
  analyticsSummary,
  isAnalyticsLoading,
  isDeleting,
  onDeleteConfirm,
  onSoldConfirm,
  onListingUnavailable,
}: ListingDetailDialogsProps) {
  return (
    <>
      <ReportAdDialog
        adId={ad.id}
        adTitle={ad.title}
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />

      <BoostPlanDialog
        adId={ad.id}
        adTitle={ad.title}
        open={showBoostDialog}
        onOpenChange={setShowBoostDialog}
        onListingUnavailable={onListingUnavailable}
      />

      <SoldOutDialog
        adTitle={ad.title}
        open={showSoldDialog}
        onOpenChange={setShowSoldDialog}
        onSoldConfirm={onSoldConfirm}
      />

      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-link" />
              Listing analytics
            </DialogTitle>
            <DialogDescription>
              Live performance snapshot for this listing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total views</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {isAnalyticsLoading ? "..." : analyticsSummary?.total ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unique viewers</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {isAnalyticsLoading ? "..." : analyticsSummary?.unique ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last activity</p>
            <p className="mt-2 text-sm text-slate-700">
              {isAnalyticsLoading
                ? "Loading latest activity..."
                : analyticsSummary?.lastViewedAt
                  ? new Date(analyticsSummary.lastViewedAt).toLocaleString()
                  : "No recent viewer activity yet."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your pending ad. Your posting slot will not be refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Ad"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
