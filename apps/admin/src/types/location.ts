import { LocationLevel } from "@esparex/contracts";
import { Location as SharedLocation } from "@esparex/shared";
export type Location = SharedLocation & {
    adsCount?: number;
    usersCount?: number;
    createdAt: string;
};

export interface LocationFilters {
    q?: string;
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    state?: string;
    level?: LocationLevel | 'all';
}
