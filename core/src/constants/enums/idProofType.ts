/**
 * ID Proof Type Enum
 */
export const ID_PROOF_TYPE = {
    AADHAAR: 'aadhaar',
    PAN: 'pan',
    DRIVING_LICENSE: 'driving_license',
    VOTER_ID: 'voter_id'
} as const;

export type IdProofTypeValue = (typeof ID_PROOF_TYPE)[keyof typeof ID_PROOF_TYPE];
export const ID_PROOF_TYPE_VALUES = Object.values(ID_PROOF_TYPE) as [IdProofTypeValue, ...IdProofTypeValue[]];
