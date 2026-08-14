export interface AuthResult {
  userId: string;
  // Intentionally minimal until backend contract is finalized
}

export interface IAuthService {
  login(payload: unknown): Promise<AuthResult>;
  sendOtp(mobile: string): Promise<{ success: boolean; message?: string; isNewUser?: boolean }>;
  verifyOtp(mobile: string, otp: string, name?: string): Promise<AuthResult>;
  logout(): Promise<void>;
}
