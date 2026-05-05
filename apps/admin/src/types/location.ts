import type { Location as SharedLocation, LocationLevel } from "@shared/types/location";

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
