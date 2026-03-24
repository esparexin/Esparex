import { useState } from "react";
import { Package, Wrench, CircuitBoard } from "lucide-react";
import { MyAdsTab } from "./MyAdsTab";
import { MyServicesTab } from "./MyServicesTab";
import { MySparePartsTab } from "./MySparePartsTab";

interface AllListingsTabProps {
    adsProps: any;
    servicesProps: any;
    sparePartsProps: any;
}

export function AllListingsTab({
    adsProps,
    servicesProps,
    sparePartsProps
}: AllListingsTabProps) {
    const [activeListingType, setActiveListingType] = useState<"ads" | "services" | "spare-parts">("ads");

    return (
        <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-full max-w-[600px] mb-4">
                <button
                        onClick={() => setActiveListingType("ads")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                            activeListingType === "ads"
                                ? "bg-white shadow text-blue-600"
                                : "text-slate-600 hover:bg-slate-200/50"
                        }`}
                    >
                        <Package className="h-4 w-4" /> Ads
                    </button>
                    <button
                        onClick={() => setActiveListingType("services")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                            activeListingType === "services"
                                ? "bg-white shadow text-blue-600"
                                : "text-slate-600 hover:bg-slate-200/50"
                        }`}
                    >
                        <Wrench className="h-4 w-4" /> Services
                    </button>
                    <button
                        onClick={() => setActiveListingType("spare-parts")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                            activeListingType === "spare-parts"
                                ? "bg-white shadow text-blue-600"
                                : "text-slate-600 hover:bg-slate-200/50"
                        }`}
                    >
                        <CircuitBoard className="h-4 w-4" /> Spare Parts
                    </button>
            </div>

            <div className="mt-2">
                {activeListingType === "ads" && <MyAdsTab {...adsProps} />}
                {activeListingType === "services" && <MyServicesTab {...servicesProps} />}
                {activeListingType === "spare-parts" && <MySparePartsTab {...sparePartsProps} />}
            </div>
        </div>
    );
}
