import { User } from '@esparex/contracts';

export interface IUserRepository {
  getCurrentUserProfile(): Promise<User>;
  updateProfile(payload: Partial<User>): Promise<User>;
}
