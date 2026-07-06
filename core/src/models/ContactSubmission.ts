import { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../infrastructure/db';
import { applyToJSONTransform } from '../utils/schemaOptions';

export interface IContactSubmission extends Document {
    name: string;
    email: string;
    mobile?: string;
    subject?: string;
    category?: string;
    message: string;
    status: 'new' | 'read' | 'replied';
    createdAt: Date;
    updatedAt: Date;
}

const ContactSubmissionSchema = new Schema<IContactSubmission>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String },
    subject: { type: String },
    category: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
}, { timestamps: true });
applyToJSONTransform(ContactSubmissionSchema);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Covers admin "submissions by email" lookup and duplicate-submission detection
ContactSubmissionSchema.index(
    { email: 1, createdAt: -1 },
    { name: 'idx_contact_email_createdAt_idx' }
);

// Covers admin dashboard "show all new/unread submissions, newest first"
ContactSubmissionSchema.index(
    { status: 1, createdAt: -1 },
    { name: 'idx_contact_status_createdAt_idx' }
);

// TTL: auto-purge submissions older than 90 days to prevent unbounded collection growth.
// Ops team has 90 days to action each ticket before automatic cleanup.
ContactSubmissionSchema.index(
    { createdAt: 1 },
    { name: 'idx_contact_createdAt_ttl_idx', expireAfterSeconds: 60 * 60 * 24 * 90 }
);

const connection = getUserConnection();
const ContactSubmission: Model<IContactSubmission> =
    (connection.models.ContactSubmission as Model<IContactSubmission>) ||
    connection.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);

export default ContactSubmission;

