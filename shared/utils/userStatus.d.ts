import { type UserStatusValue } from "../enums/userStatus";
declare const LEGACY_ACTIVE_STATUS = "active";
export type UserStatusLike = UserStatusValue | typeof LEGACY_ACTIVE_STATUS | string | null | undefined;
export declare function normalizeUserStatus(status: UserStatusLike): UserStatusValue | undefined;
export declare function isActiveUserStatus(status: UserStatusLike): boolean;
export {};
