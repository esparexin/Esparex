export interface ITokenStorage {
  setAccessToken(accessToken: string): Promise<void>;
  getAccessToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }>;
  clearTokens(): Promise<void>;
  hasTokens(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
}
