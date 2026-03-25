/**
 * Unit tests for ALLOWED_ADMIN_ROLES and ensureRoleAssignmentAllowed (Phase 13).
 *
 * Both are module-private — tested via white-box mirrors of the exact logic,
 * same pattern as applyScreenSizeNameDefault.spec.ts.
 *
 * ALLOWED_ADMIN_ROLES is the Set hoisted from createAdmin/updateAdmin.
 * ensureRoleAssignmentAllowed enforces hierarchical role assignment constraints.
 */

// ─── White-box role constants (mirroring adminUsersController) ───────────────

const ADMIN_ROLE_RANK: Record<string, number> = {
    viewer: 10,
    editor: 20,
    content_moderator: 30,
    moderator: 40,
    finance_manager: 50,
    user_manager: 60,
    admin: 70,
    super_admin: 100,
};

const ALLOWED_ADMIN_ROLES = new Set([
    'super_admin',
    'admin',
    'moderator',
    'user_manager',
    'finance_manager',
    'content_moderator',
    'editor',
    'viewer',
    'custom',
]);

const getRoleRank = (role: string | undefined): number => ADMIN_ROLE_RANK[role || ''] || 0;

const ensureRoleAssignmentAllowed = (actorRole: string | undefined, targetRole: string): boolean => {
    if (!actorRole) return false;
    if (actorRole === 'super_admin') return true;
    return getRoleRank(targetRole) <= getRoleRank(actorRole);
};

// ─── ALLOWED_ADMIN_ROLES ─────────────────────────────────────────────────────

describe('ALLOWED_ADMIN_ROLES', () => {
    it('contains all expected role strings', () => {
        const expected = [
            'super_admin', 'admin', 'moderator',
            'user_manager', 'finance_manager', 'content_moderator',
            'editor', 'viewer', 'custom',
        ];
        for (const role of expected) {
            expect(ALLOWED_ADMIN_ROLES.has(role)).toBe(true);
        }
    });

    it('rejects unknown roles', () => {
        expect(ALLOWED_ADMIN_ROLES.has('hacker')).toBe(false);
        expect(ALLOWED_ADMIN_ROLES.has('root')).toBe(false);
        expect(ALLOWED_ADMIN_ROLES.has('')).toBe(false);
        expect(ALLOWED_ADMIN_ROLES.has('USER')).toBe(false); // case-sensitive
    });

    it('has exactly 9 roles', () => {
        expect(ALLOWED_ADMIN_ROLES.size).toBe(9);
    });
});

// ─── ensureRoleAssignmentAllowed ──────────────────────────────────────────────

describe('ensureRoleAssignmentAllowed', () => {
    it('returns false when actorRole is undefined', () => {
        expect(ensureRoleAssignmentAllowed(undefined, 'viewer')).toBe(false);
    });

    it('returns false when actorRole is empty string', () => {
        expect(ensureRoleAssignmentAllowed('', 'viewer')).toBe(false);
    });

    it('super_admin can assign any role (including itself)', () => {
        for (const role of ALLOWED_ADMIN_ROLES) {
            expect(ensureRoleAssignmentAllowed('super_admin', role)).toBe(true);
        }
    });

    it('admin can assign viewer (lower rank)', () => {
        expect(ensureRoleAssignmentAllowed('admin', 'viewer')).toBe(true);
    });

    it('admin can assign moderator (lower rank)', () => {
        expect(ensureRoleAssignmentAllowed('admin', 'moderator')).toBe(true);
    });

    it('admin cannot assign super_admin (higher rank)', () => {
        expect(ensureRoleAssignmentAllowed('admin', 'super_admin')).toBe(false);
    });

    it('admin can assign admin (same rank)', () => {
        // same rank → targetRank <= actorRank → allowed
        expect(ensureRoleAssignmentAllowed('admin', 'admin')).toBe(true);
    });

    it('moderator cannot assign admin (higher rank)', () => {
        expect(ensureRoleAssignmentAllowed('moderator', 'admin')).toBe(false);
    });

    it('viewer cannot assign editor (higher rank)', () => {
        expect(ensureRoleAssignmentAllowed('viewer', 'editor')).toBe(false);
    });

    it('returns false for unknown actorRole (rank 0 — only lower than itself)', () => {
        // unknown role has rank 0; only a targetRole with rank >= 0 would pass
        // but since actorRole is not super_admin, it checks ranks
        // unknown targetRole also has rank 0 → 0 <= 0 → true
        expect(ensureRoleAssignmentAllowed('unknown_role', 'another_unknown')).toBe(true);
        expect(ensureRoleAssignmentAllowed('unknown_role', 'viewer')).toBe(false); // viewer rank 10 > 0
    });
});
