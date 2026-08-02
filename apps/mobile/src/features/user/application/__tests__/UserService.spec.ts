import { UserService } from '../UserService';
import { IUserRepository } from '../IUserRepository';
import { User } from '@esparex/contracts';

describe('UserService Unit Tests', () => {
  let mockRepo: jest.Mocked<IUserRepository>;
  let userService: UserService;

  const sampleUser: User = {
    id: 'usr-100',
    role: 'user',
    mobile: '+919998887776',
    name: 'Alice Cooper',
    email: 'alice@example.com',
    isPhoneVerified: true,
  };

  beforeEach(() => {
    mockRepo = {
      getCurrentUserProfile: jest.fn(),
      updateProfile: jest.fn(),
    };
    userService = new UserService(mockRepo);
  });

  it('delegates getProfile call to repository', async () => {
    mockRepo.getCurrentUserProfile.mockResolvedValueOnce(sampleUser);

    const user = await userService.getProfile();
    expect(user).toEqual(sampleUser);
    expect(mockRepo.getCurrentUserProfile).toHaveBeenCalledTimes(1);
  });

  it('delegates updateProfile call to repository', async () => {
    const updatedUser = { ...sampleUser, name: 'Alice Smith' };
    mockRepo.updateProfile.mockResolvedValueOnce(updatedUser);

    const result = await userService.updateProfile({ name: 'Alice Smith' });
    expect(result).toEqual(updatedUser);
    expect(mockRepo.updateProfile).toHaveBeenCalledWith({ name: 'Alice Smith' });
  });
});
