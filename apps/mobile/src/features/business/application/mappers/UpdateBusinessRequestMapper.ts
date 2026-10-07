import type { UpdateBusinessPayload, IdProofTypeValue } from '@esparex/contracts';
import { BusinessFormState } from '../../domain/BusinessFormState';

/**
 * Maps a partial mobile business-edit form state onto the canonical
 * `UpdateBusinessPayload` contract (`@esparex/contracts`).
 *
 * Phase 3a (§5): the local `UpdateBusinessPayload` interface that shadowed the
 * canonical contract type (with a divergent shape — cf. P1-9 for the sibling
 * Create mapper) is deleted. This mapper now targets the canonical shape:
 * - `documents`: the form's typed `{type, url}` entries are partitioned into
 *   the canonical `{idProofType, idProof[], businessProof[], certificates[]}`
 *   shape the server validates.
 * - `location`: mapped onto the canonical location shape.
 */
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
      payload.documents = {
        idProofType,
        idProof,
        businessProof,
        ...(certificates.length > 0 ? { certificates } : {}),
      };
    }

    return payload;
  }
}
