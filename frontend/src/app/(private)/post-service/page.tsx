"use client";
import { withGuard } from "@/guards/withGuard";
import { requireBusinessAuth } from "@/guards/routeGuards";
import { PostServiceForm } from "@/components/user/post-service/PostServiceForm";
import { BusinessListingGatePage } from "@/components/user/BusinessListingGatePage";

function PostServicePage() {
    return (
        <BusinessListingGatePage
            listingTypeLabel="services"
            contentContainerClassName="min-h-screen bg-slate-100 sm:py-10"
        >
            <PostServiceForm />
        </BusinessListingGatePage>
    );
}

export default withGuard(PostServicePage, requireBusinessAuth);
