/**
 * securityValidators.ts — Re-export barrel (backward-compatible facade).
 *
 * Previously 494 lines. Split into three focused validator modules:
 *   - validators/validateContactSubmission.ts  (178 lines)
 *   - validators/validateSmartAlert.ts         (191 lines)
 *   - validators/validateSearchParams.ts       (122 lines)
 *
 * All existing imports continue to work unchanged.
 */

export { validateContactSubmission } from "./validators/validateContactSubmission";
export { validateSmartAlert } from "./validators/validateSmartAlert";
export { validateSearchParams } from "./validators/validateSearchParams";
