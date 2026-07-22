/**
 * Lazy HEIC converter helper.
 * Dynamically imports heic2any only when an uploaded file is identified as HEIC/HEIF.
 * Keeps heic2any (~180KB) out of the initial JavaScript bundle.
 */
export async function convertHeicToJpeg(file: File): Promise<Blob | Blob[]> {
    const isHeic = file.type === "image/heic" || file.type === "image/heif" || /\.heic$/i.test(file.name);
    if (!isHeic) {
        return file;
    }

    const { default: heic2any } = await import("heic2any");
    return heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
    });
}
