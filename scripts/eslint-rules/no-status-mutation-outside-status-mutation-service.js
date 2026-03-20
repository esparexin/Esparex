/**
 * Esparex ESLint Rule
 * Disallow direct Ad.status mutations outside StatusMutationService.
 */

const UPDATE_METHODS = new Set([
  "findByIdAndUpdate",
  "findOneAndUpdate",
  "updateOne",
  "updateMany",
  "replaceOne",
]);

const EXEMPT_FILES = [
  "StatusMutationService.ts",
  "StatusMutationService.js",
  "LifecyclePolicyGuard.ts",
  "LifecyclePolicyGuard.js",
];

const AD_IMPORT_REGEX = /from\s+['"][^'"]*\/models\/Ad['"]/;

function isStatusKey(node) {
  if (!node) return false;
  if (node.type === "Identifier") return node.name === "status";
  if (node.type === "Literal") return node.value === "status";
  return false;
}

function objectContainsStatusMutation(node) {
  if (!node || node.type !== "ObjectExpression") return false;
  for (const prop of node.properties || []) {
    if (!prop || prop.type !== "Property") continue;
    if (isStatusKey(prop.key)) return true;

    const keyName =
      prop.key?.type === "Identifier"
        ? prop.key.name
        : prop.key?.type === "Literal"
          ? String(prop.key.value)
          : "";

    if ((keyName === "$set" || keyName === "$setOnInsert") && objectContainsStatusMutation(prop.value)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct Ad.status mutation outside StatusMutationService",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    if (EXEMPT_FILES.some((suffix) => filename.endsWith(suffix))) {
      return {};
    }

    const sourceText = context.getSourceCode().text;
    if (!AD_IMPORT_REGEX.test(sourceText)) {
      return {};
    }

    return {
      AssignmentExpression(node) {
        const left = node.left;
        if (!left || left.type !== "MemberExpression") return;
        const property = left.property;
        if (!isStatusKey(property)) return;

        let objectName = "";
        if (left.object?.type === "Identifier") {
          objectName = left.object.name;
        } else if (
          left.object?.type === "TSAsExpression" &&
          left.object.expression?.type === "Identifier"
        ) {
          objectName = left.object.expression.name;
        }

        if (!/^(ad|doc|listing|entity)$/i.test(objectName)) return;

        context.report({
          node,
          message:
            "Direct status assignment is forbidden. Use StatusMutationService.mutateStatus().",
        });
      },
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;

        const method =
          callee.property?.type === "Identifier"
            ? callee.property.name
            : callee.property?.type === "Literal"
              ? String(callee.property.value)
              : "";

        if (!UPDATE_METHODS.has(method)) return;

        const updateArg = node.arguments[1];
        if (!objectContainsStatusMutation(updateArg)) return;

        context.report({
          node,
          message:
            "Direct status update query is forbidden. Route lifecycle transitions through StatusMutationService.",
        });
      },
    };
  },
};
