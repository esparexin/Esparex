"use client";

import { withGuard } from "@/guards/withGuard";
import { requireBusinessAuth } from "@/guards/routeGuards";
import PostSparePartForm from "@/components/user/post-spare-part/PostSparePartForm";
import { BusinessListingGatePage } from "@/components/user/BusinessListingGatePage";

function PostSparePartPage() {
    return (
        <BusinessListingGatePage
            listingTypeLabel="spare parts"
            contentContainerClassName="min-h-screen bg-slate-50"
        >
            <PostSparePartForm />
        </BusinessListingGatePage>
    );
}

export default withGuard(PostSparePartPage, requireBusinessAuth);
