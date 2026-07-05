import { Request } from 'express';
import { logAdminActionDirect } from './adminLogger';
import type { AdminLogFn } from '@esparex/core/services';
import type { IAuthUser } from '@esparex/core/types/auth';

export const getActorId = (req: Request): string =>
    (req.user as IAuthUser)?._id?.toString() ?? (req.user as IAuthUser)?.id ?? '';

export const getActorRole = (req: Request): string =>
    ((req.user as IAuthUser)?.role) ?? '';

export const getIp = (req: Request): string =>
    (((req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();

export const getUserAgent = (req: Request): string =>
    (req.headers['user-agent'] as string) || '';

export const buildLogFn = (req: Request): AdminLogFn =>
    (action, targetType, targetId, metadata) =>
        logAdminActionDirect(
            getActorId(req),
            action,
            targetType,
            targetId,
            metadata,
            getIp(req),
            getUserAgent(req)
        );

