import User, { IUser } from '../models/User';
import Business from '../models/Business';


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

export const getUserById = async (userId: string) => {
    return User.findById(userId).lean();
};

export const getUserWithBusiness = async (userId: string) => {
    const [user, business] = await Promise.all([
        User.findById(userId).select('-password -salt').lean(),
        Business.findOne({ userId }).lean(),
    ]);
    return { user, business };
};

export const getUserPhoneVerification = async (userId: string) => {
    return User.findById(userId).select('isPhoneVerified mobile').lean();
};
