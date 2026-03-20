export interface AdminSessionItem {
  id: string;
  adminId:
    | string
    | {
        id?: string;
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        role?: string;
      };
  tokenId?: string;
  ip?: string;
  device?: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key?: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "revoked";
  createdBy?:
    | string
    | {
        id?: string;
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      };
  revokedAt?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}
