import { Request } from 'express';
import { logAdminActionDirect, AdminLogTargetType } from '@esparex/core';

/**
 * Parameter DTO for {@link logAdminAction} (Zero Primitive Obsession:
 * whole-object parameter passing instead of six positional primitives).
 */
export interface LogAdminActionParams {
    req: Request;
    action: string;
    targetType: AdminLogTargetType;
    targetId?: string | { toString: () => string };
    metadata?: Record<string, unknown>;
    actorIdOverride?: string;
}

/**
 * Asynchronously logs an admin action.
 * Fail-safe: Any errors during logging are caught and logged to console, ensuring the main action proceeds.
 */
export const logAdminAction = async (params: LogAdminActionParams) => {
    const { req, action, targetType, targetId, metadata, actorIdOverride } = params;
    const authUser = req.user as { _id?: string; id?: string } | undefined;
    const adminId = actorIdOverride || authUser?._id || authUser?.id;

    if (!adminId) {
        return;
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    return logAdminActionDirect(
        String(adminId),
        action,
        targetType,
        targetId,
        metadata,
        ipAddress,
        userAgent
    );
};

export { logAdminActionDirect, AdminLogTargetType, AdminLogFn } from '@esparex/core';
