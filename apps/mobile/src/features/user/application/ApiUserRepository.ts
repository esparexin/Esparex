import { User } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { IUserRepository } from './IUserRepository';

export class ApiUserRepository implements IUserRepository {
  async getCurrentUserProfile(): Promise<User> {
    const response = await apiClient.get<User>('/api/v1/users/me');
    return response.data;
  }
}
