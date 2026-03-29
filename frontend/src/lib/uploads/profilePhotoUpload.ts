export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_PHOTO_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const PROFILE_PHOTO_ACCEPT = PROFILE_PHOTO_ALLOWED_MIME_TYPES.join(",");

export const PROFILE_PHOTO_ALLOWED_LABEL = "JPG, PNG, WEBP, GIF, HEIC, or HEIF";

export const isAllowedProfilePhotoType = (mimeType: string): boolean =>
  PROFILE_PHOTO_ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof PROFILE_PHOTO_ALLOWED_MIME_TYPES)[number]
  );
