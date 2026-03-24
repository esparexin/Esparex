/**
 * Business Types
 * Shared types for business management
 */

import { type Business as ApiBusiness } from "@/lib/api/user/businesses";

/**
 * Complete Business Data Model
 * All fields required for a comprehensive business profile
 */
export interface Business {
  // Identification
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  category: string;
  subCategory?: string;

  // Owner Information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress?: string;

  // Business Contact Details
  businessPhone: string;
  businessEmail: string;
  businessWhatsapp?: string;
  businessWebsite?: string;

  // Business Location
  businessAddress: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string;

  // Business Details
  description: string;
  tagline?: string;
  establishedYear?: string;
  employeeCount?: string;
  gstNumber?: string;
  panNumber?: string;

  // Products & Services
  productsOffered?: string[];
  brandsDealing?: string[];
  paymentMethods?: string[];

  // Documents
  documents?: Record<string, string>;

  // Social Media
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  // Status & Verification
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'expired';
  verified: boolean;
  verificationBadge?: string;
  verificationStatus?: string;
  gstCertificateVerified?: boolean;
  panCardVerified?: boolean;
  ownerPhotoVerified?: boolean;

  // Service Area
  serviceAreaRadius?: number;

  // Products & Services (extended)
  productsServices?: string[];

  // Ratings & Reviews
  rating?: number;
  reviewCount?: number;

  // Business Metrics
  totalAds?: number;
  premiumPlan?: boolean;
  featuredBusiness?: boolean;
  deliveryAvailable?: boolean;

  // Timestamps
  submittedAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  validUntil?: string;
  reviewedBy?: string;
}

import { 
  BUSINESS_CATEGORIES as CATEGORIES, 
  BUSINESS_TYPES, 
  INDIAN_STATES as STATES, 
  EMPLOYEE_COUNTS 
} from '@shared/constants/businessConstants';

export { CATEGORIES, BUSINESS_TYPES, STATES, EMPLOYEE_COUNTS };

export type { ApiBusiness };
