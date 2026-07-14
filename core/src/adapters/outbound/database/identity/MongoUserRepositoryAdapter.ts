import mongoose from 'mongoose';
import User from '../../../../models/User';
import Business from '../../../../models/Business';
import BlockedUser from '../../../../models/BlockedUser';
import { UserRepositoryPort, UserProfileData } from '../../../../domains/identity';
import { normalizeRole } from '../../../../utils/roleNormalization';

export class MongoUserRepositoryAdapter implements UserRepositoryPort {
    public async findActiveProfileById(id: string): Promise<UserProfileData | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await User.findOne({ _id: new mongoose.Types.ObjectId(id), status: { $ne: 'deleted' } })
            .select('name avatar createdAt isVerified location.city location.state location.country')
            .lean<UserProfileData | null>();
    }
    public async updateUser(id: string, updates: any): Promise<any> {
        return await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
    }
    public async removeUserFcmToken(userId: any, token: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { $pull: { fcmTokens: { token } } });
    }
    public async getUserById(userId: string): Promise<any> {
        const user = await User.findById(userId).lean() as any;
        if (user && user.role) user.role = normalizeRole(user.role);
        return user;
    }
    public async getUserWithBusiness(userId: string): Promise<{ user: any; business: any }> {
        const [user, business] = await Promise.all([
            User.findById(userId).select('-password -salt').lean() as any,
            Business.findOne({ userId }).lean(),
        ]);
        if (user && user.role) user.role = normalizeRole(user.role);
        return { user, business };
    }
    public async getUserPhoneVerification(userId: string): Promise<any> {
        return User.findById(userId).select('isPhoneVerified mobile').lean();
    }
    public async findUserByEmail(email: string): Promise<any> {
        return User.findOne({ email });
    }
    public async getUserAvatarById(userId: string): Promise<any> {
        return User.findById(userId).select('avatar').lean();
    }
    public async checkUserExistsById(userId: string): Promise<boolean> {
        const exists = await User.exists({ _id: new mongoose.Types.ObjectId(userId), isDeleted: { $ne: true } });
        return !!exists;
    }
    public async blockUserById(blockerId: string, blockedUserId: string): Promise<any> {
        return BlockedUser.updateOne(
            { blockerId: new mongoose.Types.ObjectId(blockerId), blockedId: new mongoose.Types.ObjectId(blockedUserId) },
            { $setOnInsert: { blockerId: new mongoose.Types.ObjectId(blockerId), blockedId: new mongoose.Types.ObjectId(blockedUserId) } },
            { upsert: true }
        );
    }
    public async unblockUserById(blockerId: string, blockedUserId: string): Promise<any> {
        return BlockedUser.deleteOne({ blockerId: new mongoose.Types.ObjectId(blockerId), blockedId: new mongoose.Types.ObjectId(blockedUserId) });
    }
}
