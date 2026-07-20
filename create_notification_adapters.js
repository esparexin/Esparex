const fs = require('fs');
const path = require('path');

const portsDir = path.join(__dirname, 'core/src/domains/notifications/ports');
const adaptersDir = path.join(__dirname, 'core/src/domains/notifications/adapters/outbound/database');

fs.mkdirSync(portsDir, { recursive: true });
fs.mkdirSync(adaptersDir, { recursive: true });

// 1. NotificationRepositoryPort
fs.writeFileSync(path.join(portsDir, 'NotificationRepositoryPort.ts'), `
export interface NotificationRepositoryPort {
    findById(id: string, session?: unknown): Promise<any | null>;
    save(notification: any, session?: unknown): Promise<any>;
    findByUserId(userId: string, pagination?: { limit: number; skip: number }, session?: unknown): Promise<any[]>;
    markAsRead(id: string, userId: string, session?: unknown): Promise<boolean>;
}
`);

// 2. SmartAlertRepositoryPort
fs.writeFileSync(path.join(portsDir, 'SmartAlertRepositoryPort.ts'), `
export interface SmartAlertRepositoryPort {
    findById(id: string, session?: unknown): Promise<any | null>;
    save(alert: any, session?: unknown): Promise<any>;
    findByUserId(userId: string, session?: unknown): Promise<any[]>;
    delete(id: string, userId: string, session?: unknown): Promise<boolean>;
}
`);

// 3. MongoNotificationRepository
fs.writeFileSync(path.join(adaptersDir, 'MongoNotificationRepository.ts'), `
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
`);

// 4. MongoSmartAlertRepository
fs.writeFileSync(path.join(adaptersDir, 'MongoSmartAlertRepository.ts'), `
import { SmartAlertRepositoryPort } from '../../../ports/SmartAlertRepositoryPort';
import SmartAlert from '../../../../../models/SmartAlert';

export class MongoSmartAlertRepository implements SmartAlertRepositoryPort {
    async findById(id: string, session?: unknown): Promise<any | null> {
        return SmartAlert.findById(id).session(session as any);
    }
    async save(alert: any, session?: unknown): Promise<any> {
        return SmartAlert.create([alert], { session: session as any }).then(res => res[0]);
    }
    async findByUserId(userId: string, session?: unknown): Promise<any[]> {
        return SmartAlert.find({ userId }).session(session as any);
    }
    async delete(id: string, userId: string, session?: unknown): Promise<boolean> {
        const res = await SmartAlert.deleteOne({ _id: id, userId }).session(session as any);
        return res.deletedCount > 0;
    }
}
`);

console.log('Ports and adapters created.');
