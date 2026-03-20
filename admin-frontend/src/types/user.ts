import type { User as SharedUser } from "../../../shared/types/User";

export type User = SharedUser;

export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        items: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    };
}
