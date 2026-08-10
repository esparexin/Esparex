/**
 * 🛡️ Esparex Governance ESLint Rule: no-unsafe-cast
 * 
 * Prohibits unsafe double type assertions and chained casting patterns:
 * - `expr as unknown as Target`
 * - `expr as any as Target`
 * - `expr as never as Target`
 * - `<Target>(<unknown>expr)`
 */

const UNPASSABLE_TYPES = new Set([
  "TSUnknownKeyword",
  "TSAnyKeyword",
  "TSNeverKeyword",
]);

function isUnsafeTypeNode(typeNode) {
  if (!typeNode) return false;
  if (UNPASSABLE_TYPES.has(typeNode.type)) return true;
  if (typeNode.type === "TSTypeReference") {
    const name = typeNode.typeName?.name;
    if (name === "unknown" || name === "any" || name === "never") return true;
  }
  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unsafe chained type assertions ('as unknown as', 'as any as', etc.)",
      category: "Type Safety Governance",
      recommended: true,
    },
    schema: [],
    messages: {
      noUnsafeChainedCast:
        "Unsafe chained type assertion ('{{pattern}}') is strictly prohibited by Esparex governance. Resolve type definitions, generics, or contracts instead.",
    },
  },
  create(context) {
    function checkCastNode(node) {
      const inner = node.expression;
      if (!inner) return;

      if (inner.type === "TSAsExpression" || inner.type === "TSTypeAssertion") {
        const innerTypeNode = inner.typeAnnotation?.typeAnnotation || inner.typeAnnotation;
        if (isUnsafeTypeNode(innerTypeNode)) {
          const typeName =
            innerTypeNode.type === "TSUnknownKeyword"
              ? "unknown"
              : innerTypeNode.type === "TSAnyKeyword"
              ? "any"
              : innerTypeNode.type === "TSNeverKeyword"
              ? "never"
              : innerTypeNode.typeName?.name || "unknown";

          context.report({
            node,
            messageId: "noUnsafeChainedCast",
            data: {
              pattern: `as ${typeName} as`,
            },
          });
        }
      }
    }

    return {
      TSAsExpression: checkCastNode,
      TSTypeAssertion: checkCastNode,
    };
  },
};
