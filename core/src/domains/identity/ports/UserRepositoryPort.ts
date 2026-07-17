export interface UserProfileData {
    _id: string;
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

export interface UserRepositoryPort {
    findActiveProfileById(id: string): Promise<UserProfileData | null>;
    updateUser(id: string, updates: Record<string, unknown>): Promise<Record<string, unknown>>;
    removeUserFcmToken(userId: string, token: string): Promise<void>;
    getUserById(userId: string): Promise<Record<string, unknown> | null>;
    getUserWithBusiness(userId: string): Promise<{ user: Record<string, unknown>; business: Record<string, unknown> }>;
    getUserPhoneVerification(userId: string): Promise<Record<string, unknown> | null>;
    findUserByEmail(email: string): Promise<Record<string, unknown> | null>;
    getUserAvatarById(userId: string): Promise<string | null>;
    checkUserExistsById(userId: string): Promise<boolean>;
    blockUserById(blockerId: string, blockedUserId: string): Promise<Record<string, unknown>>;
    unblockUserById(blockerId: string, blockedUserId: string): Promise<Record<string, unknown>>;
}
