/**
 * @deprecated Phase 3a (§5): RELOCATED to
 * `core/src/domains/catalog/domain/catalogLifecycle.ts` (DECISION-GATE §5),
 * exposed via the catalog domain public barrel (`../domains/catalog`).
 * This shim re-exports the canonical module so existing importers keep
 * working. Do not import from this path in new code. Deletion in Phase 4 (§10).
 */
export {
    IMarketplaceTrust,
    IMarketplaceTrustBase,
    marketplaceTrustDefinition,
    marketplaceTrustBaseDefinition,
    applyCatalogLifecycleFields,
    catalogEntityToJsonTransform,
} from '../domains/catalog';
