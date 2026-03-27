"use client";


import { useRouter, useParams } from 'next/navigation';
import { PostAdWizard } from '@/components/user/post-ad/PostAdWizard';
import { withGuard } from '@/guards/withGuard';
import { requireUserAuth } from '@/guards/routeGuards';
import { buildAccountListingRoute } from '@/lib/accountListingRoutes';



function EditAdPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const navigateTo = (page: string) => {
        if (page === 'profile' || page === 'ad-submission-success' || page === 'my-ads') {
            void router.replace(buildAccountListingRoute("ads", "pending"));
        } else if (page === 'home') {
            void router.replace('/');
        } else {
            void router.replace(`/${page}`);
        }
    };

    if (!id) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {/* Edit Ad Page Wrapper */}
            <PostAdWizard
                navigateTo={navigateTo}
                editAdId={id}
            />
        </div>
    );
}

export default withGuard(EditAdPage, requireUserAuth);
