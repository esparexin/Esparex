import Admin from '../../models/Admin';
import { USER_STATUS, Role } from '@esparex/shared';

export const isLastActiveSuperAdmin = async (adminId: string): Promise<boolean> => {
    const [targetAdmin, superAdminCount] = await Promise.all([
        Admin.findById(adminId).select('role status isDeleted').lean(),
        Admin.countDocuments({ role: Role.SUPER_ADMIN, status: USER_STATUS.LIVE, isDeleted: { $ne: true } }),
    ]);
    if (!targetAdmin) return false;
    const a = targetAdmin as { role?: string; status?: string };
    if (a.role !== Role.SUPER_ADMIN) return false;
    if (a.status !== USER_STATUS.LIVE) return false;
    return superAdminCount <= 1;
};
