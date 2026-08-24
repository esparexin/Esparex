import mongoose from 'mongoose';
import Plan, { type IPlan } from '../../../models/Plan';

export const findPlanByIdOrCode = async (value: unknown): Promise<IPlan | null> => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    if (mongoose.Types.ObjectId.isValid(normalized)) {
        const plan = await Plan.findById(new mongoose.Types.ObjectId(normalized));
        if (plan) {
            return plan;
        }
    }

    return Plan.findOne({ code: { $eq: normalized } });
};
