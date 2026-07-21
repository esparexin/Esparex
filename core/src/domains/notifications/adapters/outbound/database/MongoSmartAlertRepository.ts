
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
