import { useBackendStatus } from '@/context/BackendStatusContext';
import { notify } from "@/lib/notify";
import { useRouter } from 'next/navigation';
import { getPageRoute, type UserPage } from '@/lib/routeUtils';
import { useCallback } from 'react';

interface UsePostAdNavigationProps {
    navigateTo?: (path: string) => void; // Optional custom navigator (e.g. header wrapper)
}

export function usePostAdNavigation(
    { navigateTo }: UsePostAdNavigationProps = {}
) {
    const { isBackendUp } = useBackendStatus();
    const router = useRouter();
    const handlePostAdClick = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!isBackendUp) {
            notify.error('Service temporarily unavailable. Please try again later.');
            return;
        }

        const targetPage: UserPage = 'post-ad';

        if (navigateTo) {
            navigateTo(targetPage);
            return;
        }

        void router.push(getPageRoute(targetPage));
    }, [isBackendUp, navigateTo, router]);

    return {
        isBackendUp,
        handlePostAdClick
    };
}
