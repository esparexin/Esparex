export interface Brand {
    id: string;
    name: string;
    categoryId?: string; // Legacy
    categoryIds?: string[];
    status?: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}
