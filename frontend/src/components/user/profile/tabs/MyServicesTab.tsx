import React, { useState } from "react";
import Link from "next/link";
import { Wrench, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyServices, MyServicesStatus } from "./MyServicesTab.hook";
import { Loader } from "./Loader";
import { ErrorBanner } from "./ErrorBanner";
import { ServiceCard } from "./ServiceCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

type SoldReason = "sold_on_platform" | "sold_outside" | "no_longer_available";

const SOLD_REASON_OPTIONS: { value: SoldReason; label: string }[] = [
    { value: "sold_on_platform", label: "Sold on Esparex" },
    { value: "sold_outside", label: "Sold outside platform" },
    { value: "no_longer_available", label: "No longer available" },
];

const STATUS_TABS: MyServicesStatus[] = ["live", "pending", "rejected", "expired", "sold", "deactivated"];

export interface MyServicesTabProps {
    user: any;
    activeTab: string;
    statusFilter: MyServicesStatus;
    navigateTo: (page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string) => void;
    getStatusBadge: (status: string) => React.ReactNode;
    formatDate: (date: string | Date) => string;
    isBusinessApproved?: boolean;
    onRegisterBusiness?: () => void;
}

export function MyServicesTab({
    user,
    activeTab,
    statusFilter,
    getStatusBadge,
    isBusinessApproved,
    onRegisterBusiness,
}: MyServicesTabProps) {
    const [currentStatus, setCurrentStatus] = useState<MyServicesStatus>(statusFilter ?? "live");

    const {
        myServices,
        loadingServices,
        servicesError,
        handleDeleteService,
        handleMarkSoldService,
        handleDeactivateService,
        handleRepostService,
    } = useMyServices(activeTab, user, currentStatus);

    const [serviceToSell, setServiceToSell] = useState<any | null>(null);
    const [isSoldOpen, setIsSoldOpen] = useState(false);
    const [soldReason, setSoldReason] = useState<SoldReason | null>(null);
    const [isSelling, setIsSelling] = useState(false);

    const confirmSold = async () => {
        if (!serviceToSell || !soldReason) return;
        setIsSelling(true);
        try {
            await handleMarkSoldService(serviceToSell.id, soldReason);
        } finally {
            setIsSelling(false);
            setIsSoldOpen(false);
            setServiceToSell(null);
        }
    };

    return (
        <>
            {/* Header + Status Pills */}
            <div className="space-y-3 mb-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">My Services</h2>
                    {isBusinessApproved ? (
                        <Link href="/post-service">
                            <Button size="sm" variant="outline" className="rounded-full px-4 gap-2">
                                <Wrench className="h-4 w-4" /> Post New
                            </Button>
                        </Link>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full px-4 gap-2 text-slate-400 border-slate-200 cursor-not-allowed"
                            onClick={onRegisterBusiness}
                        >
                            <Lock className="h-3.5 w-3.5" /> Post New
                        </Button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setCurrentStatus(tab)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                currentStatus === tab
                                    ? "bg-slate-900 text-white shadow-lg"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loadingServices ? (
                <Loader />
            ) : servicesError ? (
                <ErrorBanner
                    message={
                        typeof servicesError === "string"
                            ? servicesError
                            : (servicesError as any)?.message || "An error occurred."
                    }
                />
            ) : myServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                    <Wrench className="w-12 h-12 opacity-30" />
                    {!isBusinessApproved ? (
                        <>
                            <p className="text-sm font-medium text-center">Register an approved business to post services.</p>
                            <Button size="sm" className="rounded-full px-5" onClick={onRegisterBusiness}>
                                Register Business
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-medium">No {currentStatus} service listings.</p>
                            {currentStatus === "live" && (
                                <Link href="/post-service">
                                    <Button size="sm" className="rounded-full px-5">
                                        <Wrench className="h-4 w-4 mr-2" /> Post Service
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {myServices.map((service) => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            onDelete={() => handleDeleteService(service.id)}
                            onMarkSold={() => {
                                setServiceToSell(service);
                                setSoldReason(null);
                                setIsSoldOpen(true);
                            }}
                            onDeactivate={() => handleDeactivateService(service.id)}
                            onRepost={() => handleRepostService(service.id)}
                            getStatusBadge={getStatusBadge}
                        />
                    ))}
                </div>
            )}

            <Dialog open={isSoldOpen} onOpenChange={setIsSoldOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mark Service as Sold</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-500 mb-3">How was this service completed?</p>
                    <div className="space-y-2">
                        {SOLD_REASON_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    soldReason === opt.value
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="serviceSoldReason"
                                    value={opt.value}
                                    checked={soldReason === opt.value}
                                    onChange={() => setSoldReason(opt.value)}
                                    className="accent-blue-600"
                                />
                                <span className="text-sm">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsSoldOpen(false)} disabled={isSelling}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmSold}
                            disabled={!soldReason || isSelling}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isSelling ? "Updating…" : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
