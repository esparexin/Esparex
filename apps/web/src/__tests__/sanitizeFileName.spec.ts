import { sanitizeFileName } from "../lib/error-handler/validation";
import { isRetryableUploadError } from "../components/user/business-registration/profile-flow/upload";

describe("sanitizeFileName & Upload Retry Policy Specifications", () => {
    describe("sanitizeFileName", () => {
        it("strips path traversal sequences (..) and path separators", () => {
            expect(sanitizeFileName("../../etc/passwd.png")).toBe("etc_passwd.png");
            expect(sanitizeFileName("C:\\Windows\\System32\\document.pdf")).toBe("C_Windows_System32_document.pdf");
        });

        it("preserves valid extensions and converts them to lowercase", () => {
            expect(sanitizeFileName("GST_License_2026.PDF")).toBe("GST_License_2026.pdf");
            expect(sanitizeFileName("ShopPhoto.PNG")).toBe("ShopPhoto.png");
        });

        it("preserves legitimate Unicode business document names", () => {
            expect(sanitizeFileName("व्यापार_प्रमाणपत्र_2026.pdf")).toBe("व्यापार_प्रमाणपत्र_2026.pdf");
            expect(sanitizeFileName("வணிக_உரிமம்.png")).toBe("வணிக_உரிமம்.png");
        });

        it("falls back to unnamed-file when input is empty or invalid", () => {
            expect(sanitizeFileName("")).toBe("unnamed-file");
            expect(sanitizeFileName("   ")).toBe("unnamed-file");
        });
    });

    describe("isRetryableUploadError", () => {
        it("identifies transient errors as retryable (408, 429, 500, 502, 503, 504, network drop)", () => {
            expect(isRetryableUploadError({ status: 503 })).toBe(true);
            expect(isRetryableUploadError({ status: 429 })).toBe(true);
            expect(isRetryableUploadError({ status: 408 })).toBe(true);
            expect(isRetryableUploadError(new Error("Network Error"))).toBe(true);
        });

        it("identifies non-retryable client errors as fast-fail (400, 401, 403, 413, 415)", () => {
            expect(isRetryableUploadError({ status: 400 })).toBe(false);
            expect(isRetryableUploadError({ status: 401 })).toBe(false);
            expect(isRetryableUploadError({ status: 403 })).toBe(false);
            expect(isRetryableUploadError({ status: 413 })).toBe(false);
            expect(isRetryableUploadError({ status: 415 })).toBe(false);
        });
    });
});
