import type { Request, Response } from 'express';
import { EMAIL_TEMPLATE_KEY } from '@esparex/contracts';

jest.mock('@esparex/core/services/SystemConfigService', () => ({
    __esModule: true,
    getSystemConfigForRead: jest.fn(),
    updateSystemConfigSections: jest.fn(),
}));

jest.mock('@esparex/core/domains/notifications/application/EmailService', () => ({
    __esModule: true,
    emailService: {
        verify: jest.fn(),
        send: jest.fn(),
    },
}));

jest.mock('../../utils/adminLogger', () => ({
    __esModule: true,
    logAdminAction: jest.fn().mockResolvedValue(undefined),
}));

import * as controller from '../../controllers/admin/adminEmailTemplateController';
import * as systemConfigService from '@esparex/core';
import { emailService } from '@esparex/core/domains/notifications';

interface MockResponse {
    status: jest.Mock;
    json: jest.Mock;
    req?: unknown;
}

const makeRes = (req?: unknown): Response => {
    const res: MockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        req,
    };
    return res as any;
};

const makeReq = (data: {
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    user?: { _id?: string; email?: string };
} = {}): Request => {
    return {
        params: {},
        body: {},
        ...data,
    } as any;
};

describe('adminEmailTemplateController', () => {
    const mockedConfigService = systemConfigService as jest.Mocked<typeof systemConfigService>;
    const mockedEmailService = emailService as jest.Mocked<typeof emailService>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedConfigService.getSystemConfigForRead.mockResolvedValue({
            emailTemplates: [
                {
                    key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET,
                    subject: 'Custom Admin Password Reset Link',
                    customHeadline: 'Reset Instructions',
                },
            ],
        } as any);
        mockedConfigService.updateSystemConfigSections.mockResolvedValue({
            config: {} as any,
            updatedSections: ['emailTemplates'],
        });
    });

    describe('listEmailTemplates', () => {
        it('lists all registered email templates with active customizations', async () => {
            const req = makeReq({
                user: { _id: 'admin_123', email: 'admin@esparex.in' },
            });
            const res = makeRes(req);

            await controller.listEmailTemplates(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET,
                            subject: 'Custom Admin Password Reset Link',
                            isCustomized: true,
                        }),
                        expect.objectContaining({
                            key: EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION,
                            isCustomized: false,
                        }),
                    ]),
                })
            );
        });
    });

    describe('getEmailTemplate', () => {
        it('returns a single template by key', async () => {
            const req = makeReq({
                params: { key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET },
                user: { _id: 'admin_123', email: 'admin@esparex.in' },
            });
            const res = makeRes(req);

            await controller.getEmailTemplate(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET,
                        subject: 'Custom Admin Password Reset Link',
                    }),
                })
            );
        });

        it('returns 404 when template key does not exist', async () => {
            const req = makeReq({
                params: { key: 'INVALID_TEMPLATE_KEY' },
                user: { _id: 'admin_123' },
            });
            const res = makeRes(req);

            await controller.getEmailTemplate(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });
    });

    describe('getEmailTemplatePreview', () => {
        it('generates HTML preview with sample variables and overrides', async () => {
            const req = makeReq({
                params: { key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED },
                body: { customHeadline: 'Special Brake Pads Approved' },
            });
            const res = makeRes(req);

            await controller.getEmailTemplatePreview(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
                        html: expect.stringContaining('Special Brake Pads Approved'),
                    }),
                })
            );
        });
    });

    describe('updateEmailTemplate', () => {
        it('saves customization overlay to system config', async () => {
            const req = makeReq({
                params: { key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED },
                body: {
                    subject: 'Congratulations! Your Ad is Live: {{title}}',
                    customHeadline: 'Ad Live Confirmation',
                    customNote: 'Thank you for selling on Esparex.',
                },
                user: { _id: 'admin_123', email: 'admin@esparex.in' },
            });
            const res = makeRes(req);

            await controller.updateEmailTemplate(req, res);

            expect(mockedConfigService.updateSystemConfigSections).toHaveBeenCalledWith(
                expect.objectContaining({
                    emailTemplates: expect.arrayContaining([
                        expect.objectContaining({
                            key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
                            subject: 'Congratulations! Your Ad is Live: {{title}}',
                            updatedBy: 'admin@esparex.in',
                        }),
                    ]),
                }),
                'admin_123'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('resetEmailTemplate', () => {
        it('removes customization overlay from system config', async () => {
            const req = makeReq({
                params: { key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET },
                user: { _id: 'admin_123', email: 'admin@esparex.in' },
            });
            const res = makeRes(req);

            await controller.resetEmailTemplate(req, res);

            expect(mockedConfigService.updateSystemConfigSections).toHaveBeenCalledWith(
                { emailTemplates: [] },
                'admin_123'
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('sendTestEmailTemplate', () => {
        it('dispatches a test email when SMTP is active', async () => {
            mockedEmailService.verify.mockResolvedValue({ ok: true });
            mockedEmailService.send.mockResolvedValue({
                success: true,
                messageId: 'msg_test_123',
            });

            const req = makeReq({
                params: { key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET },
                body: {
                    recipientEmail: 'tester@esparex.in',
                },
                user: { _id: 'admin_123', email: 'admin@esparex.in' },
            });
            const res = makeRes(req);

            await controller.sendTestEmailTemplate(req, res);

            expect(mockedEmailService.verify).toHaveBeenCalled();
            expect(mockedEmailService.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'tester@esparex.in',
                    subject: expect.stringContaining('[TEST]'),
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('returns 400 when SMTP verification fails', async () => {
            mockedEmailService.verify.mockResolvedValue({
                ok: false,
                error: 'SMTP Auth Failed: 535 Bad Credentials',
            });

            const req = makeReq({
                params: { key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET },
                body: {
                    recipientEmail: 'tester@esparex.in',
                },
                user: { _id: 'admin_123' },
            });
            const res = makeRes(req);

            await controller.sendTestEmailTemplate(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining('SMTP verification failed'),
                })
            );
        });
    });
});
