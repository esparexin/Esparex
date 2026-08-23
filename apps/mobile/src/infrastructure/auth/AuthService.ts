export interface AuthResult {
  userId: string;
  accessToken: string;
  isNewUser?: boolean;
  user?: Record<string, unknown>;
}

export interface SendOtpResult {
  success: boolean;
  isNewUser: boolean;
  otpExpiresIn: number;
  name?: string;
  message?: string;
}

export interface IAuthService {
  sendOtp(mobile: string): Promise<SendOtpResult>;
  verifyOtp(mobile: string, otp: string, name?: string): Promise<AuthResult>;
  cancelOtp(mobile: string): Promise<void>;
  logout(): Promise<void>;
}
