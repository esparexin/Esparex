import {
    escapeHtml,
    renderEmailLayout,
    renderPasswordResetEmail,
    renderPurchaseConfirmationEmail,
    renderInvoiceEmail,
    renderContactInquiryEmail,
    renderNotificationEmail,
} from '../templates/EmailLayout';

describe('EmailLayout & Template Engine', () => {
    describe('escapeHtml', () => {
        it('escapes dangerous HTML characters', () => {
            const raw = '<script>alert("XSS & \'harm\'")</script>';
            const escaped = escapeHtml(raw);
            expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS &amp; &#039;harm&#039;&quot;)&lt;/script&gt;');
            expect(escaped).not.toContain('<script>');
        });
    });

    describe('renderEmailLayout', () => {
        it('renders compliant HTML with brand header, content, and footer', () => {
            const html = renderEmailLayout({
                title: 'Test Notification',
                preheader: 'Important account update',
                contentHtml: '<p>This is a test message.</p>',
                callToAction: {
                    label: 'Click Here',
                    url: 'https://admin.esparex.in/action',
                },
                footerNote: 'Custom footer disclaimer',
            });

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<title>Test Notification</title>');
            expect(html).toContain('Important account update');
            expect(html).toContain('Esparex');
            expect(html).toContain('This is a test message.');
            expect(html).toContain('Click Here');
            expect(html).toContain('https://admin.esparex.in/action');
            expect(html).toContain('Custom footer disclaimer');
            expect(html).toContain('All rights reserved.');
        });
    });

    describe('renderPasswordResetEmail', () => {
        it('includes reset URL and expiry window', () => {
            const resetUrl = 'https://admin.esparex.in/admin/reset-password/test-token-123';
            const html = renderPasswordResetEmail({
                resetUrl,
                expiryMinutes: 10,
            });

            expect(html).toContain('Reset Your Admin Password');
            expect(html).toContain(resetUrl);
            expect(html).toContain('10 minutes');
            expect(html).toContain('Set New Password');
        });
    });

    describe('renderPurchaseConfirmationEmail', () => {
        it('renders order details and formatted amounts', () => {
            const html = renderPurchaseConfirmationEmail({
                orderId: 'ORD-987654',
                planName: 'Featured Dealer Pro',
                amount: '₹4,999.00',
                formattedDate: '26 Sep 2026',
                userName: 'Rahul Sharma',
            });

            expect(html).toContain('Hello Rahul Sharma,');
            expect(html).toContain('ORD-987654');
            expect(html).toContain('Featured Dealer Pro');
            expect(html).toContain('₹4,999.00');
            expect(html).toContain('26 Sep 2026');
        });
    });

    describe('renderInvoiceEmail', () => {
        it('renders invoice number and download button when URL provided', () => {
            const html = renderInvoiceEmail({
                invoiceNumber: 'INV-2026-0042',
                planName: 'Enterprise Banner Slot',
                amount: '₹14,999.00',
                formattedDate: '26 Sep 2026',
                downloadUrl: 'https://esparex.in/api/v1/invoices/INV-2026-0042/pdf',
                userName: 'Pooja Verma',
            });

            expect(html).toContain('Hello Pooja Verma,');
            expect(html).toContain('INV-2026-0042');
            expect(html).toContain('Enterprise Banner Slot');
            expect(html).toContain('₹14,999.00');
            expect(html).toContain('Download Tax Invoice PDF');
            expect(html).toContain('https://esparex.in/api/v1/invoices/INV-2026-0042/pdf');
        });
    });

    describe('renderContactInquiryEmail', () => {
        it('renders sender info, subject, and message safely', () => {
            const html = renderContactInquiryEmail({
                name: 'Vikram Singh',
                email: 'vikram@example.com',
                mobile: '+91 9876543210',
                subject: 'Need help with listing verification',
                message: 'Hello, please review listing #12345 as soon as possible.',
            });

            expect(html).toContain('Vikram Singh');
            expect(html).toContain('vikram@example.com');
            expect(html).toContain('+91 9876543210');
            expect(html).toContain('Need help with listing verification');
            expect(html).toContain('Hello, please review listing #12345 as soon as possible.');
        });
    });

    describe('renderNotificationEmail', () => {
        it('renders notification title, message, and call to action', () => {
            const html = renderNotificationEmail({
                title: 'Listing Approved',
                body: 'Your spare part listing "Brembo Brake Pads" has been verified and published.',
                actionUrl: 'https://esparex.in/ads/brembo-pads-123',
                actionLabel: 'View Listing',
                userName: 'Arjun Kapoor',
            });

            expect(html).toContain('Listing Approved');
            expect(html).toContain('Hello Arjun Kapoor,');
            expect(html).toContain('Brembo Brake Pads');
            expect(html).toContain('https://esparex.in/ads/brembo-pads-123');
            expect(html).toContain('View Listing');
        });
    });
});

