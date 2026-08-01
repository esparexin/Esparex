import type { PresignedUploadResult } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { PickedImage } from '../domain/PickedImage';
import { UploadedImage } from '../domain/UploadedImage';

/**
 * IImageUploadService — stable interface for uploading device images to cloud storage.
 *
 * Separates the concern of "uploading images" from "creating a listing".
 * Accepts PickedImage value objects and returns UploadedImage value objects.
 */
export interface IImageUploadService {
  /**
   * Uploads an array of PickedImage domain objects to cloud storage.
   *
   * @returns Readonly array of UploadedImage value objects containing storage keys and URLs.
   */
  uploadImages(images: readonly PickedImage[]): Promise<readonly UploadedImage[]>;
}

/**
 * ApiImageUploadService — uploads images via the presigned-URL workflow.
 *
 * Pipeline for each PickedImage:
 *   1. POST /v1/upload/presign → { uploadUrl, key, publicUrl }
 *   2. Fetch local file URI → binary blob
 *   3. PUT <uploadUrl> with binary blob and mimeType
 *   4. Return UploadedImage value object
 */
export class ApiImageUploadService implements IImageUploadService {
  public async uploadImages(images: readonly PickedImage[]): Promise<readonly UploadedImage[]> {
    const results = await Promise.all(images.map((img) => this.uploadSingle(img)));
    return results;
  }

  private async uploadSingle(image: PickedImage): Promise<UploadedImage> {
    const contentType = image.mimeType || 'image/jpeg';

    // 1. Request a presigned URL from the backend
    const presignResponse = await apiClient.post<PresignedUploadResult>('/v1/upload/presign', {
      contentType,
    });

    const { uploadUrl, key, publicUrl } = presignResponse.data;

    // 2. Fetch the local file URI as a blob and PUT to the presigned URL
    const fileResponse = await fetch(image.uri);
    const blob = await fileResponse.blob();

    await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': contentType },
    });

    return { key, url: publicUrl };
  }
}
