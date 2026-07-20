import { IUser } from '../../../../models/User';
import { userRepository } from '../../../../composition/identity';

export const updateUser = async (id: string, updates: Partial<IUser>) => {
    return await userRepository.updateUser(id, updates);
};

export const removeUserFcmToken = async (userId: unknown, token: string): Promise<void> => {
    return await userRepository.removeUserFcmToken(userId, token);
};

export const getUserById = async (userId: string) => {
    return await userRepository.getUserById(userId);
};

export const getUserWithBusiness = async (userId: string) => {
    return await userRepository.getUserWithBusiness(userId);
};

export const getUserPhoneVerification = async (userId: string) => {
    return await userRepository.getUserPhoneVerification(userId);
};

export const findUserByEmail = async (email: string) => {
    return await userRepository.findUserByEmail(email);
};

export const getUserAvatarById = async (userId: string) => {
    return await userRepository.getUserAvatarById(userId);
};

export const checkUserExistsById = async (userId: string) => {
    return await userRepository.checkUserExistsById(userId);
};

export const blockUserById = async (blockerId: string, blockedUserId: string) => {
    return await userRepository.blockUserById(blockerId, blockedUserId);
};

export const unblockUserById = async (blockerId: string, blockedUserId: string) => {
    return await userRepository.unblockUserById(blockerId, blockedUserId);
};
