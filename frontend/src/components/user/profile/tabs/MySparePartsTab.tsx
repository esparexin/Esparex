import React from "react";
import { Loader } from "./Loader";
import { ErrorBanner } from "./ErrorBanner";
import { formatDistanceToNow } from "date-fns";
import { useMySpare } from "./MySparePartsTab.hook";
import type { MySparePartsStatus } from "./MySparePartsTab.hook";
import type { SparePartListing } from "@/api/user/sparePartListings";
import type { User } from "@/types/User";
import { CircuitBoard, Trash2, Edit, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface MySparePartsTabProps {
    user: User | null;
    activeTab: string;
    statusFilter?: MySparePartsStatus;
    getStatusBadge: (status: string) => React.ReactNode;
    formatDate: (date: string | Date) => string;
}

export function MySparePartsTab({
    user,
    activeTab,
    statusFilter = "live",
    getStatusBadge,
}: MySparePartsTabProps) {
    const { mySpare, loadingSpare, spareError, handleDeleteSpare } = useMySpare(
        activeTab,
        user,
        statusFilter
    );

    if (loadingSpare) return <Loader />;
    if (spareError)
        return (
            <ErrorBanner
                message={
                    typeof spareError === "string"
                        ? spareError
                        : (spareError as any)?.message || "Failed to load spare part listings."
                }
            />
        );

    if (mySpare.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <Package className="w-12 h-12 opacity-30" />
                <p className="text-sm font-medium">No spare part listings yet.</p>
                <Link href="/post-spare-part-listing">
                    <Button size="sm" className="rounded-full px-5">
                        <CircuitBoard className="h-4 w-4 mr-2" /> Post Spare Part
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">My Spare Parts</h2>
                <Link href="/post-spare-part-listing">
                    <Button size="sm" variant="outline" className="rounded-full px-4 gap-2">
                        <CircuitBoard className="h-4 w-4" /> Post New
                    </Button>
                </Link>
            </div>
            {mySpare.map((listing: SparePartListing) => (
                <SparePartCard
                    key={listing.id}
                    listing={listing}
                    getStatusBadge={getStatusBadge}
                    onDelete={() => handleDeleteSpare(listing.id)}
                />
            ))}
        </div>
    );
}

function SparePartCard({
    listing,
    getStatusBadge,
    onDelete,
}: {
    listing: SparePartListing;
    getStatusBadge: (status: string) => React.ReactNode;
    onDelete: () => void;
}) {
    const timeAgo = listing.createdAt
        ? formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })
        : "";

    const thumbnail = listing.images?.[0];

    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                    <CircuitBoard className="w-8 h-8 text-slate-300" />
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 truncate">{listing.title}</p>
                    {getStatusBadge(listing.status)}
                </div>
                <p className="text-sm font-bold text-blue-600 mt-1">₹{listing.price.toLocaleString()}</p>
                {listing.location?.city && (
                    <p className="text-xs text-slate-400 mt-0.5">{listing.location.city}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/edit-spare-part/${listing.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
