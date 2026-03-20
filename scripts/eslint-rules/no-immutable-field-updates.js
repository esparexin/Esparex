/**
 * Esparex ESLint Rule
 * Blocks updates to immutable fields at AST level
 */

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow updates to immutable Esparex fields",
        },
        schema: [],
    },

    create(context) {
        const IMMUTABLE_FIELDS = [
            "location",
            "sellerId",
            "createdAt",
            "expiryDate",
            "mobile",
            "phone",
        ];

        function report(node, field) {
            context.report({
                node,
                message: `❌ Immutable field '${field}' must never be modified in Esparex.`,
            });
        }

        return {
            AssignmentExpression(node) {
                if (
                    node.left &&
                    node.left.type === "MemberExpression" &&
                    IMMUTABLE_FIELDS.includes(node.left.property?.name)
                ) {
                    report(node, node.left.property.name);
                }
            },

            Property(node) {
                if (
                    node.key &&
                    IMMUTABLE_FIELDS.includes(node.key.name)
                ) {
                    report(node, node.key.name);
                }
            },
        };
    },
};
