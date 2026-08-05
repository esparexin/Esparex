import { BusinessFormState } from '../../domain/BusinessFormState';

export interface CreateBusinessPayload {
  name: string;
  description?: string;
  businessTypes: string[];
  mobile: string;
  email: string;
  website?: string;
  gstNumber?: string;
  location: {
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  documents: Array<{
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    idProofType?: string;
  }>;
}

export class CreateBusinessRequestMapper {
  static toPayload(state: BusinessFormState): CreateBusinessPayload {
    return {
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      businessTypes: [state.businessType || 'Repair services'],
      mobile: state.mobile.trim(),
      email: state.email.trim(),
      website: state.website.trim() || undefined,
      gstNumber: state.gstNumber.trim() || undefined,
      location: {
        address: state.address.trim(),
        city: state.city.trim() || undefined,
        state: state.state.trim() || undefined,
        pincode: state.pincode.trim() || undefined,
      },
      documents: state.documents.map((doc) => ({
        type: doc.type,
        url: doc.url,
        idProofType: doc.idProofType,
      })),
    };
  }
}
