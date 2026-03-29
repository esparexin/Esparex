import { Request } from 'express';
import { User as SharedUser, UserRole, BusinessStatus } from '../../../../shared/types/User';
import { normalizeMobileVisibility } from '../../../../shared/constants/mobileVisibility';
import { serializeDoc } from '../../utils/serialize';

type UploadedFile = {
  path: string;
  mimetype: string;
  size: number;
};

type StorageSafeUser = {
  _id?: { toString: () => string } | string;
  id?: { toString: () => string } | string;
};

type SerializedLocation = {
  coordinates?: {
    type?: string;
    coordinates?: [number, number];
  };
} & Record<string, unknown>;

type SanitizedUser = {
  id?: string;
  _id?: { toString: () => string } | string;
  role?: UserRole;
  mobile?: string;
  businessStatus?: string;
  isPhoneVerified?: boolean;
  name?: string;
  email?: string;
  avatar?: string;
  businessId?: string;
  isEmailVerified?: boolean;
  createdAt?: string | Date;
  location?: SerializedLocation;
  notificationSettings?: Record<string, unknown>;
  mobileVisibility?: unknown;
} & Record<string, unknown>;

export const getUploadedFile = (req: Request): UploadedFile | null => {
  const requestWithFile = req as Request & { file?: UploadedFile };
  return requestWithFile.file ?? null;
};

export const getStorageSafeId = (user: StorageSafeUser | null | undefined): string | null => {
  if (!user) return null;
  return user._id?.toString() || user.id?.toString() || null;
};

export const sanitizeUser = (user: unknown): SanitizedUser => {
  const serialized = serializeDoc(user) as SanitizedUser;
  return {
    ...serialized,
    password: undefined,
    salt: undefined
  };
};

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    const converted = value.toString();
    return converted.length > 0 ? converted : undefined;
  }
  return undefined;
};

export const toSharedUser = (
  safeUser: SanitizedUser,
  businessStatus?: BusinessStatus,
  businessId?: string
): SharedUser => {
  const normalizedRole: UserRole = safeUser.role === 'admin'
    || safeUser.role === 'moderator'
    || safeUser.role === 'super_admin'
    || safeUser.role === 'business'
    ? safeUser.role
    : 'user';

  const location = safeUser.location;
  const locationCity = location && typeof location.city === 'string' ? location.city : undefined;
  const coordinates = location?.coordinates;
  const normalizedCoordinates =
    coordinates?.type === 'Point'
      && Array.isArray(coordinates.coordinates)
      && coordinates.coordinates.length === 2
      && typeof coordinates.coordinates[0] === 'number'
      && typeof coordinates.coordinates[1] === 'number'
      ? {
        type: 'Point' as const,
        coordinates: [coordinates.coordinates[0], coordinates.coordinates[1]] as [number, number]
      }
      : undefined;

  return {
    id: toStringOrUndefined(safeUser.id ?? safeUser._id) ?? '',
    role: normalizedRole,
    mobile: typeof safeUser.mobile === 'string' ? safeUser.mobile : '',
    businessStatus,
    isPhoneVerified: Boolean(safeUser.isPhoneVerified),
    name: typeof safeUser.name === 'string' ? safeUser.name : undefined,
    email: typeof safeUser.email === 'string' ? safeUser.email : undefined,
    profilePhoto: typeof safeUser.avatar === 'string' ? safeUser.avatar : undefined,
    businessId,
    isEmailVerified: typeof safeUser.isEmailVerified === 'boolean' ? safeUser.isEmailVerified : undefined,
    createdAt: safeUser.createdAt ? new Date(safeUser.createdAt).toISOString() : undefined,
    mobileVisibility: normalizeMobileVisibility(safeUser.mobileVisibility),
    notificationSettings:
      safeUser.notificationSettings && typeof safeUser.notificationSettings === 'object'
        ? (safeUser.notificationSettings as SharedUser['notificationSettings'])
        : undefined,
    location: locationCity
      ? {
        ...location,
        city: locationCity,
        coordinates: normalizedCoordinates
      }
      : undefined
  };
};

export const getBusinessStatus = (status: unknown): BusinessStatus | undefined => {
  const normalized = typeof status === 'string' ? status.toLowerCase() : '';
  if (normalized === 'active' || normalized === 'approved' || normalized === 'live') return 'live';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'suspended' || normalized === 'expired') return 'suspended';
  
  return undefined;
};
