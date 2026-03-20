export interface AdminUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
}

export interface AdminEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
