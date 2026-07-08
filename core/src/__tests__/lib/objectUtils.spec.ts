import { deepMerge } from '../../utils/objectUtils';

describe('deepMerge', () => {
    it('merges two flat objects', () => {
        expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('source overwrites target for same key', () => {
        expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });

    it('deeply merges nested objects', () => {
        expect(deepMerge({ a: { b: 1, c: 2 } }, { a: { b: 10, d: 3 } }))
            .toEqual({ a: { b: 10, c: 2, d: 3 } });
    });

    it('returns source when target is not an object', () => {
        expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
    });

    it('returns target when source is not an object', () => {
        expect(deepMerge({ a: 1 }, null)).toEqual({ a: 1 });
    });

    it('merges arrays by replacement', () => {
        expect(deepMerge({ items: [1, 2] }, { items: [3, 4] })).toEqual({ items: [3, 4] });
    });
});
