import User, { IUser } from '../models/User';





export const updateUser = async (id: string, updates: Partial<IUser>) => {
    return await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
};
