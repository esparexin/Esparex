/**
 * NotificationTemplate — Unit Tests
 */

import { getNotificationTemplate } from '../../services/notification/NotificationTemplateService';

describe('NotificationTemplateService', () => {
    it('should correctly render BUSINESS_APPROVED template', () => {
        const params = { name: 'Esparex Store' };
        const template = getNotificationTemplate('BUSINESS_APPROVED', params);

        expect(template.title).toBe('Business Profile Approved! 🏢');
        expect(template.body).toContain('Your business "Esparex Store" has been approved');
    });

    it('should correctly render BUSINESS_REJECTED template with reason', () => {
        const params = { name: 'Esparex Store', reason: 'Invalid ID' };
        const template = getNotificationTemplate('BUSINESS_REJECTED', params);

        expect(template.title).toBe('Business Profile Rejected ⚠️');
        expect(template.body).toContain('Reason: Invalid ID');
    });

    it('should fallback to default reason if not provided in BUSINESS_REJECTED', () => {
        const params = { name: 'Esparex Store' };
        const template = getNotificationTemplate('BUSINESS_REJECTED', params);

        expect(template.body).toContain('Reason: Incomplete documentation');
    });

    it('should correctly render SMART_ALERT template', () => {
        const params = { adTitle: 'iPhone 13', price: '45,000', location: 'Delhi' };
        const template = getNotificationTemplate('SMART_ALERT', params);

        expect(template.title).toBe('New listing matches your saved search.');
        expect(template.body).toBe('iPhone 13 • \u20B945,000 • Delhi');
    });

    it('should correctly render PRICE_DROP template', () => {
        const params = { adTitle: 'Samsung S22', price: '35,000' };
        const template = getNotificationTemplate('PRICE_DROP', params);

        expect(template.title).toBe('Price Drop! 💸');
        expect(template.body).toContain('"Samsung S22" is now \u20B935,000');
    });

    it('should correctly render NEW_CHAT_MESSAGE template with sender name', () => {
        const params = { senderName: 'Alice', text: 'Hello there!' };
        const template = getNotificationTemplate('NEW_CHAT_MESSAGE', params);

        expect(template.title).toBe('New Message from Alice');
        expect(template.body).toBe('Hello there!');
    });

    it('should fallback for NEW_CHAT_MESSAGE if text is missing', () => {
        const params = { senderName: 'Alice' };
        const template = getNotificationTemplate('NEW_CHAT_MESSAGE', params);

        expect(template.body).toBe('Sent an attachment');
    });

    it('should fallback to raw params for unknown template keys', () => {
        const params = { title: 'Custom Title', body: 'Custom Body' };
        const template = getNotificationTemplate('UNKNOWN_KEY', params);

        expect(template.title).toBe('Custom Title');
        expect(template.body).toBe('Custom Body');
    });

    it('should use template key as title if title param is missing for unknown keys', () => {
        const template = getNotificationTemplate('MY_WEIRD_EVENT', { message: 'Something happened' });

        expect(template.title).toBe('MY_WEIRD_EVENT');
        expect(template.body).toBe('Something happened');
    });
});
