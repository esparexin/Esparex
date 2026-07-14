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
        const safeId = typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : String(id);
        return await User.findByIdAndUpdate(safeId, updates, { new: true, runValidators: true }).select('-password');
    }
    public async removeUserFcmToken(userId: any, token: string): Promise<void> {
        const safeId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : String(userId);
        await User.findByIdAndUpdate(safeId, { $pull: { fcmTokens: { token: String(token ?? '') } } });
    }
    public async getUserById(userId: string): Promise<any> {
        const safeId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : String(userId);
        const user = await User.findById(safeId).lean() as any;
        if (user && user.role) user.role = normalizeRole(user.role);
        return user;
    }
    public async getUserWithBusiness(userId: string): Promise<{ user: any; business: any }> {
        const safeId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : String(userId);
        const [user, business] = await Promise.all([
            User.findById(safeId).select('-password -salt').lean() as any,
            Business.findOne({ userId: String(userId) }).lean(),
        ]);
        if (user && user.role) user.role = normalizeRole(user.role);
        return { user, business };
    }
    public async getUserPhoneVerification(userId: string): Promise<any> {
        const safeId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : String(userId);
        return User.findById(safeId).select('isPhoneVerified mobile').lean();
    }
    public async findUserByEmail(email: string): Promise<any> {
        const safeEmail = typeof email === 'string' ? email : String(email ?? '');
        return User.findOne({ email: safeEmail });
    }
    public async getUserAvatarById(userId: string): Promise<any> {
        const safeId = typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : String(userId);
        return User.findById(safeId).select('avatar').lean();
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
