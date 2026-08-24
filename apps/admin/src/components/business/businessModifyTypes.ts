import type { Business } from "@esparex/contracts";

export type CanonicalCoordinates = Business["location"]["coordinates"] | null;

export interface BusinessModifyFormState {
  name: string;
  description: string;
  mobile: string;
  email: string;
  website: string;
  gstNumber: string;
  registrationNumber: string;
  shopNo: string;
  street: string;
  landmark: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  locationId: string;
  coordinates: CanonicalCoordinates;
}

export function formatLocationLabel(location: {
  display?: string;
  name?: string;
  city?: string;
  state?: string;
  level?: string;
}) {
  return (
    location.display ||
    [location.name || location.city, location.state].filter(Boolean).join(", ") ||
    location.name ||
    location.city ||
    "Unknown location"
  );
}
