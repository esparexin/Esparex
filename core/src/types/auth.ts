/**
 * Application Authentication Types
 *
 * Defines the user structure attached to Request objects after authentication.
 */

import type { Types } from "mongoose";

export interface IAuthUser {
    _id: Types.ObjectId | string;
    id?: string;
    role: "user" | "admin" | "moderator" | "super_admin" | string;
    isAdmin?: boolean; // Explicit flag to distinguish Admin context
    permissions?: string[];
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    isPhoneVerified?: boolean;
}
