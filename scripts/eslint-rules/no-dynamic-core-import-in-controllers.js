/**
 * 🛡️ Esparex Governance ESLint Rule: no-dynamic-core-import-in-controllers
 *
 * DECISION-GATE C-11: controllers must import core capabilities statically via
 * the @esparex/core root barrel (which carries the composition facades) or
 * per-domain public barrels. Dynamic `import('@esparex/core...')` in
 * controllers hides the dependency edge from depcruise boundary rules and
 * defeats tree-shaking; it is forbidden for new code.
 *
 * Grandfathered (burn-down): the two pre-existing dynamic import sites are
 * allowlisted with reasons. Remove entries as the call sites migrate to static
 * imports; the rule fails closed on any other dynamic @esparex/core import.
 */

const GRANDFATHERED = new Map([
  [
    'backend/api/src/controllers/admin/systemConfigController.ts',
    'lazy email-service load to avoid cold-start cost; migrate to static import',
  ],
  [
    'backend/api/src/controllers/listing/createListing.controller.ts',
    'conditional location/catalog helpers; migrate to static import',
  ],
]);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow dynamic import() of '@esparex/core' in controllers (DECISION-GATE C-11)",
      category: 'Architecture Governance',
      recommended: true,
    },
    schema: [],
    messages: {
      noDynamicCoreImport:
        "Dynamic import('{{source}}') of @esparex/core is forbidden in controllers (C-11). Import statically from '@esparex/core' or '@esparex/core/domains/<name>'.",
    },
  },
  create(context) {
    const normalized = context.filename.replace(/\\/g, '/');
    const isGrandfathered = [...GRANDFATHERED.keys()].some((g) => normalized.endsWith(g));

    return {
      ImportExpression(node) {
        const source = node.source;
        if (!source || source.type !== 'Literal' || typeof source.value !== 'string') return;
        if (!source.value.startsWith('@esparex/core')) return;
        if (isGrandfathered) return;
        context.report({
          node: source,
          messageId: 'noDynamicCoreImport',
          data: { source: source.value },
        });
      },
    };
  },
};
