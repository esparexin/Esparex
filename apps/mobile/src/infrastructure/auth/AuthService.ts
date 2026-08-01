export interface AuthResult {
  userId: string;
  // Intentionally minimal until backend contract is finalized
}

export interface IAuthService {
  login(payload: unknown): Promise<AuthResult>;
  logout(): Promise<void>;
}
