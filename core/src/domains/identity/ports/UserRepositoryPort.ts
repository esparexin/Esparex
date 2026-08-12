export interface UserProfileData {
    _id: unknown;
    name?: string;
    avatar?: string;
    createdAt?: Date;
    isVerified?: boolean;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
}

export interface UserPhoneVerificationData {
    _id?: unknown;
    isPhoneVerified?: boolean;
    mobile?: string;
}

export interface UserAvatarData {
    _id?: unknown;
    avatar?: string;
}

export interface UserRepositoryPort {
    findActiveProfileById(id: string): Promise<UserProfileData | null>;
    updateUser(id: string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    removeUserFcmToken(userId: string | unknown, token: string): Promise<void>;
    getUserById(userId: string): Promise<Record<string, unknown> | null>;
    getUserWithBusiness(userId: string): Promise<{ user: Record<string, unknown> | null; business: Record<string, unknown> | null }>;
    getUserPhoneVerification(userId: string): Promise<UserPhoneVerificationData | null>;
    findUserByEmail(email: string): Promise<Record<string, unknown> | null>;
    getUserAvatarById(userId: string): Promise<UserAvatarData | null>;
    checkUserExistsById(userId: string): Promise<boolean>;
    blockUserById(blockerId: string, blockedUserId: string): Promise<unknown>;
    unblockUserById(blockerId: string, blockedUserId: string): Promise<unknown>;
}
