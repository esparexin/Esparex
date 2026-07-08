import { escapeRegExp, toTitleCase } from '../../utils/stringUtils';

describe('escapeRegExp', () => {
    it('escapes special regex characters', () => {
        expect(escapeRegExp('hello.world')).toBe('hello\\.world');
        expect(escapeRegExp('test+one')).toBe('test\\+one');
        expect(escapeRegExp('(group)')).toBe('\\(group\\)');
        expect(escapeRegExp('a|b')).toBe('a\\|b');
    });

    it('returns empty string for empty input', () => {
        expect(escapeRegExp('')).toBe('');
    });

    it('passes through plain text unchanged', () => {
        expect(escapeRegExp('hello world')).toBe('hello world');
    });

    it('escapes all special characters', () => {
        const special = '.*+?^${}()|[]\\';
        const result = escapeRegExp(special);
        expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });
});

describe('toTitleCase', () => {
    it('converts lowercase string to title case', () => {
        expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('handles single word', () => {
        expect(toTitleCase('hello')).toBe('Hello');
    });

    it('returns empty string for undefined', () => {
        expect(toTitleCase(undefined)).toBe('');
    });

    it('returns empty string for empty', () => {
        expect(toTitleCase('')).toBe('');
    });

    it('lowercases mixed case words', () => {
        expect(toTitleCase('hELLO wORLD')).toBe('Hello World');
    });
});
