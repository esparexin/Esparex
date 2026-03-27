"use client";

import { useRouter } from 'next/navigation';
import { AdSubmissionSuccess } from '@/components/user/AdSubmissionSuccess';
import { UserPage } from '@/lib/routeUtils';
import { buildAccountListingRoute } from '@/lib/accountListingRoutes';



export default function AdSubmissionSuccessPage() {
    const router = useRouter();
    const navigateTo = (page: UserPage) => {
        const path = page === 'my-ads' ? buildAccountListingRoute('ads', 'pending') : '/';
        void router.replace(path);
    };

    return (
        <AdSubmissionSuccess navigateTo={navigateTo} />
    );
}
