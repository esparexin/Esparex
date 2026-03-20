"use client";

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { User } from '@/types/User';
import logger from "@/lib/logger";

type GuardFunction = (user: User) => void;

export function withGuard<P extends object>(
    Component: React.ComponentType<P>,
    guard: GuardFunction
) {
    return function Guarded(props: P) {
        const router = useRouter();
        const pathname = usePathname();
        const { user, loading: isLoading } = useUser();
        const authorized = useMemo(() => {
            if (!user) return false;
            try {
                guard(user);
                return true;
            } catch (e) {
                logger.error("Access denied:", e);
                return false;
            }
        }, [user]);

        useEffect(() => {
            if (!user && !isLoading) {
                const callbackUrl = encodeURIComponent(pathname || '/');
                void router.replace(`/login?callbackUrl=${callbackUrl}`);
                return;
            }

            if (user && !authorized) {
                void router.replace('/unauthorized');
            }
        }, [user, isLoading, authorized, router, pathname]);

        if (isLoading) return null;
        if (!authorized) return null;

        return <Component {...props} />;
    };
}
