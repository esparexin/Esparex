import imageCompression from 'browser-image-compression';
import logger from "@/lib/logger";

export const fileToBase64 = async (file: File): Promise<string> => {
    try {
        // Compress if image
        if (file.type.startsWith('image/')) {
            const options = {
                maxSizeMB: 0.8,
                maxWidthOrHeight: 1920,
                // Keep compression local-only; the default worker path uses an external CDN.
                useWebWorker: false
            };
            const compressedFile = await imageCompression(file, options);
            file = compressedFile;
        }

        return new Promise((resolve, reject) => {
            if (!(file instanceof Blob)) {
                logger.warn("Invalid file object encountered:", file);
                reject(new Error("Invalid file object"));
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    } catch (err) {
        logger.warn("Compression failed, using original", err);
        // Fallback
        return new Promise((resolve, reject) => {
            if (!(file instanceof Blob)) {
                reject(new Error("Invalid file object"));
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }
};
