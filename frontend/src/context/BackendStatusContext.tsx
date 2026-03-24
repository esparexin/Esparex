"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

type BackendStatus = {
    isBackendUp: boolean;
    checked: boolean;
};

const BackendStatusContext = createContext<BackendStatus>({
    isBackendUp: false,
    checked: false,
});

export function BackendStatusProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isBackendUp, setIsBackendUp] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const apiBase = (
            process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`
        ).replace(/\/$/, "");
        fetch(`${apiBase}/${API_ROUTES.USER.HEALTH}`, {
            method: "GET",
        })
            .then(() => setIsBackendUp(true))
            .catch(() => setIsBackendUp(false))
            .finally(() => setChecked(true));
    }, []);

    const value = useMemo(
        () => ({ isBackendUp, checked }),
        [checked, isBackendUp]
    );

    return (
        <BackendStatusContext.Provider value={value}>
            {children}
        </BackendStatusContext.Provider>
    );
}

export function useBackendStatus() {
    return useContext(BackendStatusContext);
}
