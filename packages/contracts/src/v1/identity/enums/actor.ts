/**
 * Actor Enums — Single Source of Truth for lifecycle mutation actors.
 */

export const ACTOR_TYPE = {
    USER: 'user',
    ADMIN: 'admin',
    SYSTEM: 'system',
} as const;

export type ActorTypeValue = (typeof ACTOR_TYPE)[keyof typeof ACTOR_TYPE];

export const ACTOR_TYPE_VALUES = Object.values(ACTOR_TYPE) as [ActorTypeValue, ...ActorTypeValue[]];

export interface ActorMetadata {
    type: ActorTypeValue;
    id?: string;
    ip?: string;
    userAgent?: string;
}
