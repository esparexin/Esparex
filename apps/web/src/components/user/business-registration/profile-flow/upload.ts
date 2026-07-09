"use client";

import { uploadBusinessImage } from "@/lib/api/user/businesses";
import type { SubmissionStatus } from "./types";

export async function processStagedFiles(items: Array<File | string>, options?: { label?: string; onProgress?: (status: SubmissionStatus) => void }) {
    const results: string[] = [];
    const totalUploadable = items.filter((item): item is File => item instanceof File).length;
    let uploadedCount = 0;
    for (const item of items) {
        if (!(item instanceof File)) { results.push(item); continue; }
        uploadedCount++;
        options?.onProgress?.({ title: options.label || "Uploading files", detail: `${uploadedCount} of ${totalUploadable} file${totalUploadable === 1 ? "" : "s"} uploaded` });
        results.push(await uploadBusinessImage(item, item.type === "application/pdf" ? "documents" : "businesses"));
    }
    return results;
}
