import type { ContactSubmissionRequest } from '@esparex/contracts';
import ContactSubmission, { IContactSubmission } from '../../../../models/ContactSubmission';

// Request DTO owned by @esparex/contracts (audit E17).
type CreateContactInput = ContactSubmissionRequest;

export async function createContactSubmission(input: CreateContactInput): Promise<IContactSubmission> {
    return ContactSubmission.create({
        name: input.name,
        email: input.email,
        mobile: input.mobile,
        subject: input.subject,
        category: input.category,
        message: input.message,
        status: 'new',
    });
}
