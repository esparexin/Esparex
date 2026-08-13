'use client';

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Spinner } from '@esparex/ui';

interface ChatInputProps {
  onSend: (text: string, attachment?: File) => Promise<boolean>;
  disabled?: boolean;
  disabledReason?: string;
  isSending?: boolean;
  /** Controlled value — set by parent (e.g. quick reply) */
  value?: string;
  /** Called when internal textarea changes (for controlled mode) */
  onValueChange?: (text: string) => void;
  /** Triggered when user starts/stops typing */
  onTypingChange?: (isTyping: boolean) => void;
}

const MAX_LENGTH = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function ChatInput({ onSend, disabled, disabledReason, isSending, value, onValueChange, onTypingChange }: ChatInputProps) {
  const [internalText, setInternalText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const text = value !== undefined ? value : internalText;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetComposer = () => {
    if (onValueChange) onValueChange('');
    else setInternalText('');
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (onTypingChange) onTypingChange(false);
  };

  const validateMagicBytes = async (file: File): Promise<boolean> => {
    try {
      const buffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // JPEG: FF D8
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      // PNG: 89 50 4E 47
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      // WebP: RIFF (52 49 46 46)
      const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
      return isJpeg || isPng || isWebp;
    } catch {
      return false;
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds 5 MB limit');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isValidImage = await validateMagicBytes(file);
    if (!isValidImage) {
      setFileError('Only JPEG, PNG, and WebP images are allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedFile) || disabled || isSending) return;

    if (selectedFile) setUploadProgress(30);
    const didSend = await onSend(trimmed, selectedFile ?? undefined);
    if (didSend) {
      setUploadProgress(100);
      resetComposer();
    } else {
      setUploadProgress(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && selectedFile) {
      setSelectedFile(null);
      setFileError(null);
    } else if ((e.key === 'Enter' && !e.shiftKey) || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value.slice(0, MAX_LENGTH);
    if (onValueChange) {
      onValueChange(newVal);
    } else {
      setInternalText(newVal);
    }

    if (onTypingChange) {
      onTypingChange(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 2500);
    }

    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  if (disabled) {
    return (
      <div className="chat-input chat-input--disabled">
        <p className="chat-input__disabled-msg">
          🔒 {disabledReason ?? 'This chat is closed'}
        </p>
      </div>
    );
  }

  return (
    <div className="chat-input-shell space-y-2">
      {/* File Preview Banner */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg border text-xs text-slate-700">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold truncate">{selectedFile.name}</span>
            <span className="text-slate-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 font-bold px-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            onClick={() => setSelectedFile(null)}
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
          className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"
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

      <div className="chat-input">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { void handleFileSelect(e); }}
          aria-label="Choose image attachment"
        />
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach file"
          disabled={isSending}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          placeholder="Type a message…"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={MAX_LENGTH}
          aria-label="Message input"
        />
        <span className="chat-input__count">
          {text.length}/{MAX_LENGTH}
        </span>
        <button
          type="button"
          className="chat-input__send"
          onClick={() => {
            void handleSend();
          }}
          disabled={(!text.trim() && !selectedFile) || isSending}
          aria-label="Send message"
        >
          {isSending ? (
            <Spinner size="sm" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
