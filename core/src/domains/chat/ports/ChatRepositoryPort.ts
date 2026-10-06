/**
 * @deprecated The chat domain shell is merged into `communications` (P1-5).
 * Canonical location: `core/src/domains/communications/ports/ChatRepositoryPort.ts`
 * (re-exported through the communications barrel below).
 * This file is frozen and will be deleted in Phase 4 (DECISION-GATE §4).
 * Import the port from the communications domain instead.
 *
 * NOTE: the re-export goes through the communications barrel (not the
 * `ports/` directory directly) to satisfy the depcruiser
 * `no-cross-domain-deep-imports` rule.
 */
export * from '../../communications';
