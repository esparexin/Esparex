import { User } from '@esparex/contracts';
import { IUserRepository } from './IUserRepository';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getProfile(): Promise<User> {
    return this.userRepository.getCurrentUserProfile();
  }

  async updateProfile(payload: Partial<User>): Promise<User> {
    return this.userRepository.updateProfile(payload);
  }
}
