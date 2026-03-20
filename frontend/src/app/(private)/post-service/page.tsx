"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { withGuard } from "@/guards/withGuard";
import { requireBusinessAuth } from "@/guards/routeGuards";
import { PostServiceForm } from "@/components/user/post-service/PostServiceForm";
import { Button } from "@/components/ui/button";

function PostServicePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { businessData, isLoading } = useBusiness(user);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-slate-500 font-medium">Checking business verification...</div>
            </div>
        );
    }

    if (!businessData || (businessData.status as string) !== 'published' && (businessData.status as string) !== 'approved') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Verification Pending</h1>
                    <p className="text-slate-600">
                        Your business verification is under review. You can post services after approval.
                    </p>
                    <Button 
                        onClick={() => router.push("/account/business")}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                        Go to Business Status
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 sm:py-10">
            <PostServiceForm />
        </div>
    );
}

export default withGuard(PostServicePage, requireBusinessAuth);
