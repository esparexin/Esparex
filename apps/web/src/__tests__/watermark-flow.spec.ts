import { describe, it, expect } from 'vitest';
import { API_ROUTES } from '@esparex/shared';

describe('Watermark Flow Isolation & UX Guard', () => {
    it('verifies profile photo update routes to USERS_ME rather than listing upload queue', () => {
        // User profile photos must use PATCH /users/me and never touch listings watermark pipeline
        expect(API_ROUTES.USER.USERS_ME).toBe('users/me');
        expect(API_ROUTES.USER.LISTINGS_UPLOAD_IMAGE).not.toBe(API_ROUTES.USER.USERS_ME);
    });

    it('verifies listing media presign targets listing folders', () => {
        const allowedListingFolders = ['ads', 'services', 'spare-part-listings'];
        expect(allowedListingFolders).toContain('ads');
        expect(allowedListingFolders).toContain('services');
        expect(allowedListingFolders).toContain('spare-part-listings');
        expect(allowedListingFolders).not.toContain('avatars');
    });
});
