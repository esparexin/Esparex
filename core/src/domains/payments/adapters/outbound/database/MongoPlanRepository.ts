import { PlanRepositoryPort } from '../../../ports/PlanRepositoryPort';
import Plan from '../../../../../models/Plan';
import UserPlan from '../../../../../models/UserPlan';
import type { ClientSession } from 'mongoose';

export class MongoPlanRepository implements PlanRepositoryPort {
    async findPlanById(planId: string, session?: unknown): Promise<any | null> {
        const query = Plan.findById(planId);
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async findPlanByCode(code: string, session?: unknown): Promise<any | null> {
        const query = Plan.findOne({ code });
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async findUserPlan(userId: string, session?: unknown): Promise<any | null> {
        const query = UserPlan.findOne({ userId, isActive: true });
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }

    async saveUserPlan(userPlan: any, session?: unknown): Promise<any> {
        if (!userPlan._id) {
            const newUserPlan = new UserPlan(userPlan);
            return newUserPlan.save({ session: session as ClientSession });
        }
        
        return UserPlan.findByIdAndUpdate(userPlan._id, userPlan, { 
            new: true, 
            session: session as ClientSession 
        }).exec();
    }

    async findActiveUserPlans(session?: unknown): Promise<any[]> {
        const query = UserPlan.find({ isActive: true });
        if (session) {
            query.session(session as ClientSession);
        }
        return query.exec();
    }
}
