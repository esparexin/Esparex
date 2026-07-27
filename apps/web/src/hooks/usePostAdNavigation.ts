import { useBackendStatus } from '@/context/BackendStatusContext';
import { notify } from "@/lib/feedback";
import { useRouter } from 'next/navigation';
import { getPageRoute, type UserPage } from '@/lib/routeUtils';
import { useCallback } from 'react';

interface UsePostAdNavigationProps {
    navigateTo?: (path: string) => void; // Optional custom navigator (e.g. header wrapper)
    isLoggedIn?: boolean;
    onShowLogin?: (callbackUrl?: string) => void;
}

export function usePostAdNavigation(
    { navigateTo, isLoggedIn, onShowLogin }: UsePostAdNavigationProps = {}
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

        if (!isLoggedIn && onShowLogin) {
            onShowLogin('/post-ad');
            return;
        }

        const targetPage: UserPage = 'post-ad';

        if (navigateTo) {
            navigateTo(targetPage);
            return;
        }

        void router.push(getPageRoute(targetPage));
    }, [isBackendUp, isLoggedIn, onShowLogin, navigateTo, router]);

    return {
        isBackendUp,
        handlePostAdClick
    };
}
