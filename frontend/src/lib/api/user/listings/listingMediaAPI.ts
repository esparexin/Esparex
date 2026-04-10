import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from '../../routes';
import { toApiResult } from '@/lib/api/result';

// --- S3 Upload Helpers ---

export interface PresignedUploadResult {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    expiresIn: number;
}

/**
 * Requests a pre-signed S3 URL for direct file upload.
 */
export const getListingImagePresignedUrl = async (
    contentType: string,
    folder: 'ads' | 'staging' | 'business' | 'avatars' | 'service' = 'ads',
    adId?: string
): Promise<PresignedUploadResult> => {
    const { data: result } = await toApiResult<PresignedUploadResult>(
        apiClient.post(API_ROUTES.USER.ADS_UPLOAD_PRESIGN, { contentType, folder, adId })
    );
    if (!result) throw new Error('Failed to get presigned upload URL');
    return result;
};

/**
 * Uploads a file directly to S3 using a pre-signed URL.
 */
export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
    }
};