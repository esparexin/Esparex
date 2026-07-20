export interface PlanRepositoryPort {
    findPlanById(planId: string, session?: unknown): Promise<any | null>;
    findPlanByCode(code: string, session?: unknown): Promise<any | null>;
    findUserPlan(userId: string, session?: unknown): Promise<any | null>;
    saveUserPlan(userPlan: any, session?: unknown): Promise<any>;
    findActiveUserPlans(session?: unknown): Promise<any[]>;
}
