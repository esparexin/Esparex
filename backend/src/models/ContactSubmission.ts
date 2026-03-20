import { Schema, Document, Model } from 'mongoose';
import { getUserConnection } from '../config/db';

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
// toJSON Transform - Convert _id to id
ContactSubmissionSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: unknown, ret: unknown) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

const connection = getUserConnection();
const ContactSubmission: Model<IContactSubmission> =
    (connection.models.ContactSubmission as Model<IContactSubmission>) ||
    connection.model<IContactSubmission>('ContactSubmission', ContactSubmissionSchema);

export default ContactSubmission;
