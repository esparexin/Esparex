
import { NotificationRepositoryPort } from '../../../ports/NotificationRepositoryPort';
import Notification from '../../../../../models/Notification';

export class MongoNotificationRepository implements NotificationRepositoryPort {
    async findById(id: string, session?: unknown): Promise<any | null> {
        return Notification.findById(id).session(session as any);
    }
    async save(notification: any, session?: unknown): Promise<any> {
        return Notification.create([notification], { session: session as any }).then(res => res[0]);
    }
    async findByUserId(userId: string, pagination: { limit: number; skip: number } = { limit: 20, skip: 0 }, session?: unknown): Promise<any[]> {
        return Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit)
            .session(session as any);
    }
    async markAsRead(id: string, userId: string, session?: unknown): Promise<boolean> {
        const res = await Notification.updateOne(
            { _id: id, userId },
            { $set: { read: true } },
            { session: session as any }
        );
        return res.modifiedCount > 0;
    }
}
