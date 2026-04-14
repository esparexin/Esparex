import User, { IUser } from '../models/User';
import Business from '../models/Business';
import BlockedUser from '../models/BlockedUser';
import mongoose from 'mongoose';


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

export const findUserByEmail = async (email: string) => {
    return User.findOne({ email });
};

export const getUserAvatarById = async (userId: string) => {
    return User.findById(userId).select('avatar').lean();
};

export const checkUserExistsById = async (userId: string) => {
    return User.exists({
        _id: new mongoose.Types.ObjectId(userId),
        isDeleted: { $ne: true }
    });
};

export const blockUserById = async (blockerId: string, blockedUserId: string) => {
    return BlockedUser.updateOne(
        {
            blockerId: new mongoose.Types.ObjectId(blockerId),
            blockedId: new mongoose.Types.ObjectId(blockedUserId)
        },
        {
            $setOnInsert: {
                blockerId: new mongoose.Types.ObjectId(blockerId),
                blockedId: new mongoose.Types.ObjectId(blockedUserId)
            }
        },
        { upsert: true }
    );
};

export const unblockUserById = async (blockerId: string, blockedUserId: string) => {
    return BlockedUser.deleteOne({
        blockerId: new mongoose.Types.ObjectId(blockerId),
        blockedId: new mongoose.Types.ObjectId(blockedUserId)
    });
};
