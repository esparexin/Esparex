jest.mock('@esparex/core/domains/notifications/application/NotificationService', () => ({
  registerToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@esparex/core/domains/identity/application/users/UserService', () => ({
  removeUserFcmToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@esparex/core/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { registerToken } from '../../controllers/notification/notificationMutationController';
import { removeUserFcmToken } from '@esparex/core/domains/identity/application/users/UserService';
import * as notificationService from '@esparex/core/domains/notifications/application/NotificationService';
import type { Request, Response } from 'express';

const mockedRegisterTokenService = notificationService.registerToken as jest.Mock;
const mockedRemoveUserFcmToken = removeUserFcmToken as jest.Mock;

const makeMockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

describe('Push Token Controllers (PR 2A Backend Test Hardening)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notificationMutationController.registerToken', () => {
    it('registers token for authenticated user successfully', async () => {
      const req = {
        user: { _id: 'user-123' },
        body: { token: 'ExponentPushToken[xyz123456789]', platform: 'ios' },
      } as unknown as Request;
      const res = makeMockRes();

      await registerToken(req, res);

      expect(mockedRegisterTokenService).toHaveBeenCalledWith(
        'user-123',
        'ExponentPushToken[xyz123456789]',
        'ios'
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token registered',
        })
      );
    });

    it('defaults platform to web if not provided in body', async () => {
      const req = {
        user: { _id: 'user-456' },
        body: { token: 'ExponentPushToken[xyz123456789]' },
      } as unknown as Request;
      const res = makeMockRes();

      await registerToken(req, res);

      expect(mockedRegisterTokenService).toHaveBeenCalledWith(
        'user-456',
        'ExponentPushToken[xyz123456789]',
        'web'
      );
    });

    it('returns 401 Unauthorized if user is missing from request', async () => {
      const req = {
        body: { token: 'ExponentPushToken[xyz123456789]' },
      } as unknown as Request;
      const res = makeMockRes();

      await registerToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockedRegisterTokenService).not.toHaveBeenCalled();
    });

    it('returns 500 if registerToken service throws an error', async () => {
      mockedRegisterTokenService.mockRejectedValueOnce(new Error('DB failure'));

      const req = {
        user: { _id: 'user-123' },
        body: { token: 'ExponentPushToken[xyz123456789]' },
      } as unknown as Request;
      const res = makeMockRes();

      await registerToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('UserService.removeUserFcmToken (Logout Token Cleanup)', () => {
    it('removes FCM token for user when provided', async () => {
      await removeUserFcmToken('user-789', 'ExponentPushToken[xyz123456789]');

      expect(mockedRemoveUserFcmToken).toHaveBeenCalledWith(
        'user-789',
        'ExponentPushToken[xyz123456789]'
      );
    });
  });
});
