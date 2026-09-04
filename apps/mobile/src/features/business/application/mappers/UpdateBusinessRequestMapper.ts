import { BusinessFormState } from '../../domain/BusinessFormState';

export interface UpdateBusinessPayload {
  name?: string;
  description?: string;
  businessTypes?: string[];
  mobile?: string;
  email?: string;
  website?: string;
  gstNumber?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  documents?: Array<{
    type: 'id_proof' | 'business_proof' | 'certificate';
    url: string;
    idProofType?: string;
  }>;
}

export class UpdateBusinessRequestMapper {
  static toPayload(state: Partial<BusinessFormState>): UpdateBusinessPayload {
    const payload: UpdateBusinessPayload = {};

    if (state.name !== undefined) {
      payload.name = state.name.trim();
    }
    if (state.description !== undefined) {
      payload.description = state.description.trim() || undefined;
    }
    if (state.businessType !== undefined) {
      payload.businessTypes = [state.businessType || 'Repair services'];
    }
    if (state.mobile !== undefined) {
      payload.mobile = state.mobile.trim();
    }
    if (state.email !== undefined) {
      payload.email = state.email.trim();
    }
    if (state.website !== undefined) {
      payload.website = state.website.trim() || undefined;
    }
    if (state.gstNumber !== undefined) {
      payload.gstNumber = state.gstNumber.trim() || undefined;
    }

    if (
      state.address !== undefined ||
      state.city !== undefined ||
      state.state !== undefined ||
      state.pincode !== undefined
    ) {
      payload.location = {
        address: state.address?.trim() ?? '',
        city: state.city?.trim() || undefined,
        state: state.state?.trim() || undefined,
        pincode: state.pincode?.trim() || undefined,
      };
    }

    if (state.documents !== undefined) {
      payload.documents = state.documents.map((doc) => ({
        type: doc.type,
        url: doc.url,
        idProofType: doc.idProofType,
      }));
    }

    return payload;
  }
}
