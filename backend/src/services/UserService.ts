import User, { IUser } from '../models/User';





export const updateUser = async (id: string, updates: Partial<IUser>) => {
    return await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    }).select('-password');
};

export const removeUserFcmToken = async (userId: unknown, token: string): Promise<void> => {
    await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token } }
    });
};
