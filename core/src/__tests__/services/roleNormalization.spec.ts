import { Role } from '@esparex/contracts';
import { normalizeRole, isSuperAdminRole, isAdminRole } from '../../utils/roleNormalization';
import { roleGrantsPermission } from '../../constants/adminPermissions';

describe('Role Normalization & Super Admin Permission Verification', () => {
    it('normalizes Role.SUPER_ADMIN to "super_admin"', () => {
        expect(Role.SUPER_ADMIN).toBe('super_admin');
    });

    it('correctly normalizes legacy role strings', () => {
        expect(normalizeRole('superAdmin')).toBe(Role.SUPER_ADMIN);
        expect(normalizeRole('super_admin')).toBe(Role.SUPER_ADMIN);
        expect(normalizeRole('superadmin')).toBe(Role.SUPER_ADMIN);
        expect(normalizeRole('admin')).toBe(Role.ADMIN);
        expect(normalizeRole('moderator')).toBe(Role.MODERATOR);
        expect(normalizeRole('user')).toBe(Role.USER);
    });

    it('identifies super admin roles via isSuperAdminRole helper', () => {
        expect(isSuperAdminRole('super_admin')).toBe(true);
        expect(isSuperAdminRole('superAdmin')).toBe(true);
        expect(isSuperAdminRole('superadmin')).toBe(true);
        expect(isSuperAdminRole('admin')).toBe(false);
        expect(isSuperAdminRole('user')).toBe(false);
    });

    it('identifies administrative roles via isAdminRole helper', () => {
        expect(isAdminRole('super_admin')).toBe(true);
        expect(isAdminRole('superAdmin')).toBe(true);
        expect(isAdminRole('admin')).toBe(true);
        expect(isAdminRole('moderator')).toBe(false);
        expect(isAdminRole('user')).toBe(false);
    });

    it('grants all permissions to super admin via roleGrantsPermission', () => {
        expect(roleGrantsPermission('super_admin', 'catalog:write')).toBe(true);
        expect(roleGrantsPermission('superAdmin', 'catalog:write')).toBe(true);
        expect(roleGrantsPermission('super_admin', 'users:write')).toBe(true);
        expect(roleGrantsPermission('super_admin', 'system:config')).toBe(true);
        expect(roleGrantsPermission('super_admin', 'non_existent_permission')).toBe(true);
    });
});
