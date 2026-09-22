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

export const validateImageMagicBytes = async (file: File): Promise<boolean> => {
  try {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    return isJpeg || isPng || isWebp;
  } catch {
    return false;
  }
};
