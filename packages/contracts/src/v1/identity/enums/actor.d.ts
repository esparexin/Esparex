/**
 * Actor Enums — Single Source of Truth for lifecycle mutation actors.
 */
export declare const ACTOR_TYPE: {
    readonly USER: "user";
    readonly ADMIN: "admin";
    readonly SYSTEM: "system";
};
export type ActorTypeValue = (typeof ACTOR_TYPE)[keyof typeof ACTOR_TYPE];
export declare const ACTOR_TYPE_VALUES: [ActorTypeValue, ...ActorTypeValue[]];
export interface ActorMetadata {
    type: ActorTypeValue;
    id?: string;
    ip?: string;
    userAgent?: string;
}
