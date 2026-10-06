import type { CreateBusinessPayload, IdProofTypeValue } from '@esparex/contracts';
import { BusinessFormState } from '../../domain/BusinessFormState';

/**
 * Maps the mobile business-registration form state onto the canonical
 * `CreateBusinessPayload` contract (`@esparex/contracts`).
 *
 * P1-9: the local `CreateBusinessPayload` interface that shadowed the canonical
 * contract type (with a divergent shape) is deleted. This mapper now targets
 * the canonical shape:
 * - `documents`: the form's typed `{type, url}` entries are partitioned into
 *   the canonical `{idProofType, idProof[], businessProof[], certificates[]}`
 *   shape the server validates.
 * - `location`: mapped onto the canonical location shape. Coordinates are
 *   optional at the wire-contract level (P1-9) — the mobile flow has no
 *   location-capture step.
 * - `images`: omitted — the mobile flow has no shop-image upload step
 *   (optional at the wire-contract level, P1-9).
 */
export class CreateBusinessRequestMapper {
  static toPayload(state: BusinessFormState): CreateBusinessPayload {
    const idProof = state.documents
      .filter((doc) => doc.type === 'id_proof')
      .map((doc) => doc.url);
    const businessProof = state.documents
      .filter((doc) => doc.type === 'business_proof')
      .map((doc) => doc.url);
    const certificates = state.documents
      .filter((doc) => doc.type === 'certificate')
      .map((doc) => doc.url);
    const idProofType: IdProofTypeValue =
      state.documents.find((doc) => doc.type === 'id_proof')?.idProofType ?? 'aadhaar';

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
      documents: {
        idProofType,
        idProof,
        businessProof,
        ...(certificates.length > 0 ? { certificates } : {}),
      },
    };
  }
}
