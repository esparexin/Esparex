module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Disallow direct access to user fields",
        },
    },
    create(context) {
        return {
            MemberExpression(node) {
                const forbidden = [
                    "businessId",
                    "role",
                    "isVerified",
                    "businessStatus",
                ];

                // Ensure we are accessing a property on an object that looks like a user session
                // This is a naive check (checking property name only), but effective for catching direct usage
                // A more robust check would require type information, which is harder in local rules without TS parser services
                if (
                    node.property &&
                    forbidden.includes(node.property.name)
                ) {
                    // Exclude files where we WANT to access these (mappings, types, guards)
                    const filename = context.getFilename();
                    if (
                        filename.includes("mapUserSession.ts") ||
                        filename.includes("businessGuards.ts") ||
                        filename.includes("UserSession.ts") ||
                        filename.includes("users.ts") || // API mapping needs access
                        filename.includes("userSession.schema.ts")
                    ) {
                        return;
                    }

                    context.report({
                        node,
                        message:
                            "Do not access user fields directly. Use UserSession + guards.",
                    });
                }
            },
        };
    },
};
