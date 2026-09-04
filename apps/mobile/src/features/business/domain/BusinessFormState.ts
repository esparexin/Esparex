import { Business, IdProofTypeValue } from '@esparex/contracts';

export interface BusinessFormDocument {
  type: 'id_proof' | 'business_proof' | 'certificate';
  url: string;
  idProofType?: IdProofTypeValue;
}

export interface BusinessFormState {
  name: string;
  description: string;
  businessType: string;
  mobile: string;
  email: string;
  website: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  documents: BusinessFormDocument[];
}

export const INITIAL_BUSINESS_FORM_STATE: BusinessFormState = {
  name: '',
  description: '',
  businessType: 'Repair services',
  mobile: '',
  email: '',
  website: '',
  gstNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  documents: [],
};

export function businessToFormState(business: Business): BusinessFormState {
  return {
    name: business.name || '',
    description: business.description || '',
    businessType: business.businessTypes?.[0] || 'Repair services',
    mobile: business.mobile || '',
    email: business.email || '',
    website: business.website || '',
    gstNumber: business.gstNumber || '',
    address: business.location?.address || '',
    city: business.location?.city || '',
    state: business.location?.state || '',
    pincode: business.location?.pincode || '',
    documents: Array.isArray(business.documents)
      ? business.documents.map((doc) => ({
          type: doc.type,
          url: doc.url,
          idProofType: doc.idProofType,
        }))
      : [],
  };
}
