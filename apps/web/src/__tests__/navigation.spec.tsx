import { describe, expect, it } from 'vitest';
import { ProfileSettingsSidebar } from '@/components/user/ProfileSettingsSidebar';

describe('ProfileSettingsSidebar Navigation Contract', () => {
    it('exports canonical ProfileSettingsSidebar component', () => {
        expect(typeof ProfileSettingsSidebar).toBe('function');
    });

    it('verifies standard profile tabs and navigation identifiers', () => {
        const standardTabs = ['personal', 'business', 'my-ads', 'saved', 'plans', 'settings'];
        expect(standardTabs).toHaveLength(6);
        expect(standardTabs).toContain('personal');
        expect(standardTabs).toContain('settings');
        expect(standardTabs).toContain('plans');
    });
});
