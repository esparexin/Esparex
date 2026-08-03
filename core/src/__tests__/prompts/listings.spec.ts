import { generateListingPromptV1 } from '../../prompts/listings/v1';

describe('generateListingPromptV1', () => {
    it('generates prompt containing 80-character maximum title rule', () => {
        const prompt = generateListingPromptV1({
            category: 'Smartphones',
            brand: 'Apple',
            model: 'iPhone 13',
            condition: 'Used',
        });

        expect(prompt).toContain('80 characters');
        expect(prompt).toContain('Indian marketplace seller');
        expect(prompt).toContain('FORBIDDEN ASSUMPTIONS');
        expect(prompt).toContain('Storage');
        expect(prompt).toContain('RAM');
        expect(prompt).toContain('Accessories');
        expect(prompt).toContain('Warranty');
    });

    it('includes power status and working parts when provided', () => {
        const prompt = generateListingPromptV1({
            category: 'Laptops',
            brand: 'Dell',
            model: 'XPS 15',
            condition: 'For Parts',
            powerStatus: 'On',
            workingParts: 'Screen, Keyboard',
        });

        expect(prompt).toContain('Power Status: On');
        expect(prompt).toContain('Working Spare Parts: Screen, Keyboard');
    });
});
