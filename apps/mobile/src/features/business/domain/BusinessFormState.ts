import { IdProofTypeValue } from '@esparex/contracts';

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
