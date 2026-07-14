export interface UserProfileData {
    _id: any;
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
    updateUser(id: string, updates: any): Promise<any>;
    removeUserFcmToken(userId: any, token: string): Promise<void>;
    getUserById(userId: string): Promise<any>;
    getUserWithBusiness(userId: string): Promise<{ user: any; business: any }>;
    getUserPhoneVerification(userId: string): Promise<any>;
    findUserByEmail(email: string): Promise<any>;
    getUserAvatarById(userId: string): Promise<any>;
    checkUserExistsById(userId: string): Promise<boolean>;
    blockUserById(blockerId: string, blockedUserId: string): Promise<any>;
    unblockUserById(blockerId: string, blockedUserId: string): Promise<any>;
}
