import type { GeoJSONPoint } from "@/types/location";

export interface StepData {
    businessName: string;
    businessDescription: string;
    // Structured Address
    locationId?: string | null;
    shopNo: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: GeoJSONPoint | null;
    // Contact
    contactNumber: string;
    email: string;
    idProofType?: string; // e.g. "aadhaar", "pan", etc.
    idProof: File | string | null;
    businessProof: File | string | null;
    certificates: (File | string)[];
    shopImages: (File | string)[];

    // Field-level Validation Errors
    errors?: Partial<Record<keyof StepData, string>>;
}

// Contract Lock
export interface StepBaseProps {
    formData: StepData;
    setFormData: React.Dispatch<React.SetStateAction<StepData>>;
}
