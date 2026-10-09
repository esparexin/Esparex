'use strict';

/**
 * Migration: initialize-system-config-email-templates
 *
 * Ensures the singleton system_configs document has `emailTemplates` initialized
 * as an array if missing or null, conforming to the typed EmailTemplateCustomization schema.
 *
 * Safe to re-run: idempotent update.
 */
module.exports = {
    async up(db) {
        const collection = db.collection('system_configs');
        const result = await collection.updateMany(
            {
                $or: [
                    { emailTemplates: { $exists: false } },
                    { emailTemplates: null }
                ]
            },
            { $set: { emailTemplates: [] } }
        );

        console.log(
            `[migrate] initialize-system-config-email-templates: initialized emailTemplates on ${result.modifiedCount} document(s)`
        );
    },

    async down(db) {
        console.log('[migrate] initialize-system-config-email-templates DOWN: no-op');
    }
};
