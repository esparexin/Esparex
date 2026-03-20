"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PostSparePartSuccessPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full space-y-5">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl">
                    ✅
                </div>
                <h1 className="text-xl font-bold text-slate-900">Spare Part Submitted!</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Your spare part listing is now <span className="font-semibold text-amber-600">under review</span>. We typically approve listings within 24 hours.
                </p>
                <div className="space-y-2 pt-2">
                    <Button
                        className="w-full h-12 rounded-2xl font-bold"
                        onClick={() => router.push("/account/business")}
                    >
                        Go to My Listings
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full h-12 rounded-2xl text-slate-500"
                        onClick={() => router.push("/post-spare-part-listing")}
                    >
                        Post Another Part
                    </Button>
                </div>
            </div>
        </div>
    );
}
