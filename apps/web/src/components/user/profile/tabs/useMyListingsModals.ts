"use client";

import { useState } from "react";
import type { Listing } from "@/lib/api/user/listings";
import type { SoldReason } from "@/components/user/shared/MarkAsSoldDialog";
import type { ListingSubTab, ListingActionHandlers } from "./MyListingsConfig";
import type { MyListingsDialogsProps } from "./MyListingsDialogs";

interface UseMyListingsModalsParams {
  subTab: ListingSubTab;
  handleDeleteAd: (id: string) => Promise<unknown>;
  handleDeleteService: (id: string) => Promise<unknown>;
  handleDeleteSpare: (id: string) => Promise<unknown>;
  handleDeactivateAd: (id: string) => Promise<unknown>;
  handleDeactivateService: (id: string) => Promise<unknown>;
  handleDeactivateSpare: (id: string) => Promise<unknown>;
  handleActivateAd: (id: string) => Promise<unknown>;
  handleActivateService: (id: string) => Promise<unknown>;
  handleActivateSpare: (id: string) => Promise<unknown>;
  handleMarkAdSold: (id: string, reason: SoldReason) => Promise<unknown>;
  handleMarkSpareSold: (id: string, reason: SoldReason) => Promise<unknown>;
  handleRepostAd: (id: string) => void;
  handleRepostService: (id: string) => void;
  handleRepostSpare: (id: string) => void;
  getStatusBadge: (status: string, adId?: string | number) => React.ReactNode;
  fetchMyAds: () => void | Promise<unknown>;
}

export function useMyListingsModals({
  subTab,
  handleDeleteAd,
  handleDeleteService,
  handleDeleteSpare,
  handleDeactivateAd,
  handleDeactivateService,
  handleDeactivateSpare,
  handleActivateAd,
  handleActivateService,
  handleActivateSpare,
  handleMarkAdSold,
  handleMarkSpareSold,
  handleRepostAd,
  handleRepostService,
  handleRepostSpare,
  getStatusBadge,
  fetchMyAds,
}: UseMyListingsModalsParams) {
  const [adToDelete, setAdToDelete] = useState<Listing | null>(null);
  const [isDeleteAdOpen, setIsDeleteAdOpen] = useState(false);
  const [adToDeactivate, setAdToDeactivate] = useState<Listing | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [adToActivate, setAdToActivate] = useState<Listing | null>(null);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  const [adToSell, setAdToSell] = useState<Listing | null>(null);
  const [isSoldOpen, setIsSoldOpen] = useState(false);
  const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
  const [isSelling, setIsSelling] = useState(false);

  const [spareToSell, setSpareToSell] = useState<Listing | null>(null);
  const [isSparesSoldOpen, setIsSparesSoldOpen] = useState(false);
  const [sparesSoldReason, setSparesSoldReason] = useState<SoldReason | null>(null);
  const [isSpareSelling, setIsSpareSelling] = useState(false);

  const [boostAd, setBoostAd] = useState<Listing | null>(null);
  const [isBoostOpen, setIsBoostOpen] = useState(false);

  const confirmDeleteAd = async () => {
    if (!adToDelete) return;
    const type = subTab === "ads" ? "ad" : subTab === "services" ? "service" : "spare_part";
    if (type === "ad") await handleDeleteAd(adToDelete.id);
    else if (type === "service") await handleDeleteService(adToDelete.id);
    else await handleDeleteSpare(adToDelete.id);
    setIsDeleteAdOpen(false);
    setAdToDelete(null);
  };

  const confirmDeactivate = async () => {
    if (!adToDeactivate) return;
    const type = subTab === "ads" ? "ad" : subTab === "services" ? "service" : "spare_part";
    if (type === "ad") await handleDeactivateAd(adToDeactivate.id);
    else if (type === "service") await handleDeactivateService(adToDeactivate.id);
    else await handleDeactivateSpare(adToDeactivate.id);
    setIsDeactivateOpen(false);
    setAdToDeactivate(null);
  };

  const confirmActivate = async () => {
    if (!adToActivate) return;
    const type = subTab === "ads" ? "ad" : subTab === "services" ? "service" : "spare_part";
    if (type === "ad") await handleActivateAd(adToActivate.id);
    else if (type === "service") await handleActivateService(adToActivate.id);
    else await handleActivateSpare(adToActivate.id);
    setIsActivateOpen(false);
    setAdToActivate(null);
  };

  const confirmSold = async () => {
    if (!adToSell || !soldReason) return;
    setIsSelling(true);
    try {
      await handleMarkAdSold(adToSell.id, soldReason);
    } finally {
      setIsSelling(false);
      setAdToSell(null);
      setIsSoldOpen(false);
    }
  };

  const confirmSoldSpare = async () => {
    if (!spareToSell || !sparesSoldReason) return;
    setIsSpareSelling(true);
    try {
      await handleMarkSpareSold(spareToSell.id, sparesSoldReason);
    } finally {
      setIsSpareSelling(false);
      setSpareToSell(null);
      setIsSparesSoldOpen(false);
    }
  };

  const actionHandlers: ListingActionHandlers = {
    onDelete: (listing: Listing) => { setAdToDelete(listing); setIsDeleteAdOpen(true); },
    onDeactivate: (listing: Listing) => { setAdToDeactivate(listing); setIsDeactivateOpen(true); },
    onActivate: (listing: Listing) => { setAdToActivate(listing); setIsActivateOpen(true); },
    onMarkSoldAd: (listing: Listing) => { setAdToSell(listing); setSoldReason(null); setIsSoldOpen(true); },
    onMarkSoldSpare: (listing: Listing) => { setSpareToSell(listing); setSparesSoldReason(null); setIsSparesSoldOpen(true); },
    onRepostAd: (id: string) => handleRepostAd(id),
    onRepostService: (id: string) => handleRepostService(id),
    onRepostSpare: (id: string) => handleRepostSpare(id),
    onBoost: (listing: Listing) => { setBoostAd(listing); setIsBoostOpen(true); },
    getStatusBadge,
  };

  const dialogProps: MyListingsDialogsProps = {
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
    onBoostPlanPurchased: () => {
      void fetchMyAds();
    },
  };

  return { actionHandlers, dialogProps };
}
