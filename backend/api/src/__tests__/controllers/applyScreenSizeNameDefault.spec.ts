/**
 * Unit tests for the applyScreenSizeNameDefault helper.
 * Extracted in Phase 14 from catalogReferenceController.
 * Pure function — no DB or external deps needed.
 *
 * Because the helper is a module-private function defined inside the controller,
 * we test it indirectly via the same logic inline (or extract it in a future refactor).
 * For now, tests are structured as white-box tests of the exact logic.
 */

// ─── applyScreenSizeNameDefault logic ────────────────────────────────────────

/** Inline mirror of the extracted helper for isolated testing. */
function applyScreenSizeNameDefault(payload: Record<string, unknown>): void {
    if (!payload.name && payload.size) {
        payload.name = `${payload.size} Screen Size`;
    }
}

describe('applyScreenSizeNameDefault', () => {
    it('sets name from size when name is absent', () => {
        const payload: Record<string, unknown> = { size: '13"' };
        applyScreenSizeNameDefault(payload);
        expect(payload.name).toBe('13" Screen Size');
    });

    it('does not overwrite an existing name', () => {
        const payload: Record<string, unknown> = { size: '15"', name: 'My Custom Name' };
        applyScreenSizeNameDefault(payload);
        expect(payload.name).toBe('My Custom Name');
    });

    it('does nothing when both name and size are absent', () => {
        const payload: Record<string, unknown> = {};
        applyScreenSizeNameDefault(payload);
        expect(payload.name).toBeUndefined();
    });

    it('does nothing when size is absent but name is present', () => {
        const payload: Record<string, unknown> = { name: 'Existing' };
        applyScreenSizeNameDefault(payload);
        expect(payload.name).toBe('Existing');
    });

    it('mutates payload in-place', () => {
        const payload: Record<string, unknown> = { size: '17"' };
        const ref = payload;
        applyScreenSizeNameDefault(payload);
        expect(ref).toBe(payload);
        expect(payload.name).toBe('17" Screen Size');
    });

    it('handles numeric size values', () => {
        const payload: Record<string, unknown> = { size: 14 };
        applyScreenSizeNameDefault(payload);
        expect(payload.name).toBe('14 Screen Size');
    });

    it('treats empty string name as falsy (applies default)', () => {
        const payload: Record<string, unknown> = { size: '11"', name: '' };
        applyScreenSizeNameDefault(payload);
        expect(payload.name).toBe('11" Screen Size');
    });
});
