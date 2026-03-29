import type { Location as SharedLocation, LocationLevel } from "../../../shared/types/Location";

export type Location = SharedLocation & {
    adsCount?: number;
    usersCount?: number;
    createdAt: string;
};

export interface LocationFilters {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    state?: string;
    level?: LocationLevel | 'all';
    isPopular?: 'true' | 'false' | 'all';
}
