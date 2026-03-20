"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PostServiceSuccessPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
            <div className="bg-white max-w-sm w-full rounded-2xl p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">
                        ✅ Service Submitted Successfully
                    </h1>
                    <p className="text-sm text-slate-600">
                        🕒 Your service listing is under admin review. It will go live after approval.
                    </p>
                </div>

                <div className="space-y-3 pt-4">
                    <Button 
                        onClick={() => router.push("/account/business?tab=pending")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-xl"
                    >
                        Go to My Listings
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => router.push("/post-service")}
                        className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold h-12 rounded-xl"
                    >
                        Post Another Service
                    </Button>
                </div>
            </div>
        </div>
    );
}
