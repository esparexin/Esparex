import { useEffect, useState } from "react";

import { fetchAdminSidebarCounts, type SidebarCounters } from "@/lib/api/adminSidebar";

export function useAdminSidebarCounts() {
    const [counts, setCounts] = useState<SidebarCounters>({});

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const nextCounts = await fetchAdminSidebarCounts();
                if (!cancelled) {
                    setCounts(nextCounts);
                }
            } catch {
                if (!cancelled) {
                    setCounts({});
                }
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, []);

    return counts;
}
