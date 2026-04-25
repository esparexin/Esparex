/**
 * ID Proof Type Enum
 */
export declare const ID_PROOF_TYPE: {
    readonly AADHAAR: "aadhaar";
    readonly PAN: "pan";
    readonly DRIVING_LICENSE: "driving_license";
    readonly VOTER_ID: "voter_id";
};
export type IdProofTypeValue = (typeof ID_PROOF_TYPE)[keyof typeof ID_PROOF_TYPE];
export declare const ID_PROOF_TYPE_VALUES: [IdProofTypeValue, ...IdProofTypeValue[]];
