/**
 * EmailService — Unit Tests
 */

import nodemailer from 'nodemailer';
import { EmailService } from '../../domains/notifications/application/EmailService';
import { getSystemConfigDoc } from '../../utils/systemConfigHelper';

jest.mock('nodemailer');
jest.mock('../../utils/systemConfigHelper');
jest.mock('../../utils/logger');

const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
const mockedGetSystemConfigDoc = getSystemConfigDoc as jest.Mock;

describe('EmailService', () => {
    let emailService: EmailService;
    let mockTransporter: any;

    beforeEach(() => {
        jest.clearAllMocks();
        emailService = new EmailService();
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'msg_123' }),
            verify: jest.fn().mockResolvedValue(true),
        };
        mockedNodemailer.createTransport.mockReturnValue(mockTransporter);
    });

    it('should successfully send an email when correctly configured', async () => {
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                email: {
                    enabled: true,
                    provider: 'smtp',
                    host: 'smtp.gmail.com',
                    username: 'user',
                    password: 'pass'
                }
            }
        });

        const result = await emailService.sendEmail('test@example.com', 'Subject', '<p>Hello</p>');

        expect(result).toBe(true);
        expect(mockedNodemailer.createTransport).toHaveBeenCalled();
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'test@example.com',
            subject: 'Subject',
            html: '<p>Hello</p>'
        }));
    });

    it('should skip sending if email is disabled in config', async () => {
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                email: { enabled: false }
            }
        });

        const result = await emailService.sendEmail('test@example.com', 'Subject', 'Body');

        expect(result).toBe(false);
        expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should fail gracefully if SMTP credentials are missing', async () => {
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                email: { enabled: true, host: '', username: '', password: '' }
            }
        });

        const result = await emailService.sendEmail('test@example.com', 'Subject', 'Body');

        expect(result).toBe(false);
        expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should reuse transporter if config has not changed', async () => {
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                email: {
                    enabled: true,
                    provider: 'smtp',
                    host: 'smtp.gmail.com',
                    username: 'user',
                    password: 'pass'
                }
            }
        });

        await emailService.sendEmail('test@example.com', 'S1', 'B1');
        await emailService.sendEmail('test@example.com', 'S2', 'B2');

        expect(mockedNodemailer.createTransport).toHaveBeenCalledTimes(1);
    });

    it('should recreate transporter if config changes', async () => {
        const config1 = {
            notifications: {
                email: { enabled: true, provider: 'smtp', host: 'h1', username: 'u1', password: 'p1' }
            }
        };
        const config2 = {
            notifications: {
                email: { enabled: true, provider: 'smtp', host: 'h2', username: 'u2', password: 'p2' }
            }
        };

        mockedGetSystemConfigDoc.mockResolvedValueOnce(config1).mockResolvedValueOnce(config2);

        await emailService.sendEmail('test@example.com', 'S1', 'B1');
        await emailService.sendEmail('test@example.com', 'S2', 'B2');

        expect(mockedNodemailer.createTransport).toHaveBeenCalledTimes(2);
    });

    it('should return errorMessage when sendMail throws', async () => {
        mockedGetSystemConfigDoc.mockResolvedValue({
            notifications: {
                email: { enabled: true, provider: 'smtp', host: 'h1', username: 'u1', password: 'p1' }
            }
        });
        mockTransporter.sendMail.mockRejectedValue(new Error('Auth failed'));

        const result = await emailService.send({ to: 'test@example.com', subject: 'S', html: 'H' });

        expect(result.success).toBe(false);
        expect(result.skippedReason).toBe('SEND_ERROR');
        expect(result.errorMessage).toContain('Auth failed');
    });

    describe('verify()', () => {
        it('should return ok=true when SMTP connection succeeds', async () => {
            mockedGetSystemConfigDoc.mockResolvedValue({
                notifications: {
                    email: { enabled: true, provider: 'smtp', host: 'smtp.test.com', username: 'u', password: 'p' }
                }
            });
            mockTransporter.verify.mockResolvedValue(true);

            const result = await emailService.verify();

            expect(result.ok).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return ok=false with error when SMTP verify throws', async () => {
            mockedGetSystemConfigDoc.mockResolvedValue({
                notifications: {
                    email: { enabled: true, provider: 'smtp', host: 'smtp.test.com', username: 'u', password: 'p' }
                }
            });
            mockTransporter.verify.mockRejectedValue(new Error('Invalid login'));

            const result = await emailService.verify();

            expect(result.ok).toBe(false);
            expect(result.error).toContain('Invalid login');
        });

        it('should return ok=false when credentials are incomplete', async () => {
            mockedGetSystemConfigDoc.mockResolvedValue({
                notifications: {
                    email: { enabled: true, provider: 'smtp', host: '', username: '', password: '' }
                }
            });

            const result = await emailService.verify();

            expect(result.ok).toBe(false);
            expect(result.error).toContain('incomplete');
        });

        it('should return ok=false when email is disabled', async () => {
            mockedGetSystemConfigDoc.mockResolvedValue({
                notifications: { email: { enabled: false } }
            });

            const result = await emailService.verify();

            expect(result.ok).toBe(false);
            expect(result.error).toContain('disabled');
        });
    });
});

