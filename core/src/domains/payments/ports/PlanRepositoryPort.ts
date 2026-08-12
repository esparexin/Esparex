export interface PlanRepositoryPort {
    findPlanById(planId: string, session?: unknown): Promise<Record<string, unknown> | null>;
    findPlanByCode(code: string, session?: unknown): Promise<Record<string, unknown> | null>;
    findUserPlan(userId: string, session?: unknown): Promise<Record<string, unknown> | null>;
    saveUserPlan(userPlan: Record<string, unknown>, session?: unknown): Promise<Record<string, unknown>>;
    findActiveUserPlans(session?: unknown): Promise<Record<string, unknown>[]>;
}
