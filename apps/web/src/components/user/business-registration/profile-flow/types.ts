export type SubmissionStatus = { title: string; detail: string };
export type BusinessWizardFormShape = {
    name: string; description: string; address: string; currentLocationDisplay: string;
    currentLocationSource?: "" | "default" | "auto" | "ip" | "manual"; currentLocationCity?: string; currentLocationState?: string;
    currentLocationPincode?: string; currentLocationCountry?: string; coordinates?: Record<string, unknown> | null;
    mobile: string; email: string;
};
