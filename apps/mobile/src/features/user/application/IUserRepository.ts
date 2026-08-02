import { User } from '@esparex/contracts';

export interface IUserRepository {
  getCurrentUserProfile(): Promise<User>;
}
