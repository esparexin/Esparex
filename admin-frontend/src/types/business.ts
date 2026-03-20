import type { 
    Business as SharedBusiness, 
    BusinessLocation as SharedBusinessLocation,
    BusinessDocument as SharedBusinessDocument
} from "../../../shared/types/Business";

export type Business = SharedBusiness;
export type BusinessLocation = SharedBusinessLocation;
export type IBusinessDocument = SharedBusinessDocument;

export interface BusinessCategory {
    category: string;
    services: boolean;
    spareParts: boolean;
    isLocked: boolean;
}
