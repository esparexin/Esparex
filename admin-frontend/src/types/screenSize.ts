export interface ScreenSize {
    id: string;
    size: string;
    name: string;
    value: number;
    categoryId: string;
    brandId?: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt?: string;
    updatedAt?: string;
}
