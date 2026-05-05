import ContactSubmission, { IContactSubmission } from '../models/ContactSubmission';

interface CreateContactInput {
    name: string;
    email: string;
    mobile?: string;
    subject?: string;
    category?: string;
    message: string;
}

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
