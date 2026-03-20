import type { GeoJSONPoint } from "@/types/location";

export interface StepData {
    businessTypes: string[];
    deviceCategories: Array<{
        category: string;
        services: boolean;
        spareParts: boolean;
        isLocked: boolean;
    }>;
    businessName: string;
    businessDescription: string;
    // Structured Address
    shopNo: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    pincodeError?: string;
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

export const initialStepData: StepData = {
    businessTypes: [],
    deviceCategories: [],
    businessName: "",
    businessDescription: "",
    shopNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    coordinates: null,
    contactNumber: "",
    email: "",
    idProof: null,
    businessProof: null,
    certificates: [],
    shopImages: []
};

// Contract Lock
export interface StepBaseProps {
    formData: StepData;
    setFormData: React.Dispatch<React.SetStateAction<StepData>>;
    onNext: () => void;
    onBack?: () => void; // Optional for first step
    isActive: boolean;
    isCompleted: boolean;
    onEdit: () => void;
}
