import type { GeoJSONPoint, AppLocationSource } from "@/types/location";

export interface StepData {
    name: string;
    description: string;
    address: string;
    currentLocationDisplay: string;
    currentLocationSource: AppLocationSource | "";
    currentLocationCity: string;
    currentLocationState: string;
    currentLocationPincode: string;
    currentLocationCountry: string;
    coordinates: GeoJSONPoint | null;
    isSnapped?: boolean;
    // Contact
    mobile: string;
    email: string;
    idProofType?: string; // e.g. "aadhaar", "pan", etc.
    idProof: File | string | null;
    businessProof: File | string | null;
    certificates: (File | string)[];
    images: (File | string)[];

    // Field-level Validation Errors
    errors?: Partial<Record<keyof StepData, string>>;
}

// Contract Lock
export interface StepBaseProps {
    formData: StepData;
    setFormData: React.Dispatch<React.SetStateAction<StepData>>;
}
