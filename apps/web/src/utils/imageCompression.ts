/**
 * Utility for client-side image compression and WebP/JPEG normalization.
 * Downscales large images to max 1920px dimensions and compresses with ~85% quality.
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // SVG, GIF, or small files under 300KB do not need compression
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.size < 300 * 1024) {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = "image/webp",
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression yields larger file, stick to original file
            return resolve(file);
          }

          const extension = mimeType === "image/webp" ? ".webp" : ".jpg";
          const newName = file.name.replace(/\.[^/.]+$/, "") + extension;
          const compressedFile = new File([blob], newName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export async function compressImagesBatch(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file)));
}
