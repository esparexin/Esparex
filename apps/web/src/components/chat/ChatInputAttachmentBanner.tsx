'use client';

interface ChatInputAttachmentBannerProps {
  selectedFile: File | null;
  onRemoveFile: () => void;
  fileError: string | null;
  uploadProgress: number | null;
}

export function ChatInputAttachmentBanner({
  selectedFile,
  onRemoveFile,
  fileError,
  uploadProgress,
}: ChatInputAttachmentBannerProps) {
  return (
    <>
      {/* File Preview Banner */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted rounded-lg border border-border text-caption text-foreground-secondary">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold truncate">{selectedFile.name}</span>
            <span className="text-muted-foreground">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
          </div>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground font-bold px-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            onClick={onRemoveFile}
            aria-label="Remove attached file"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Announcement */}
      {fileError && (
        <p className="text-xs font-medium text-red-600 px-1" role="alert" aria-live="polite">
          {fileError}
        </p>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div
          className="w-full bg-muted h-1.5 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={uploadProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${uploadProgress}% uploaded`}
          aria-live="polite"
          aria-label="Attachment upload progress"
        >
          <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
    </>
  );
}
