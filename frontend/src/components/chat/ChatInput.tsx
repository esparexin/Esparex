'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
  isSending?: boolean;
  /** Controlled value — set by parent (e.g. quick reply) */
  value?: string;
  /** Called when internal textarea changes (for controlled mode) */
  onValueChange?: (text: string) => void;
}

const MAX_LENGTH = 2000;

export function ChatInput({ onSend, disabled, disabledReason, isSending, value, onValueChange }: ChatInputProps) {
  // Support both controlled (value/onValueChange) and uncontrolled mode
  const [internalText, setInternalText] = useState('');
  const text = value !== undefined ? value : internalText;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isSending) return;
    // Clear both controlled and uncontrolled modes
    if (onValueChange) onValueChange('');
    else setInternalText('');
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await onSend(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value.slice(0, MAX_LENGTH);
    if (onValueChange) {
      onValueChange(newVal);
    } else {
      setInternalText(newVal);
    }
    // Auto-grow
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
    <div className="chat-input">
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
        className="chat-input__send"
        onClick={handleSend}
        disabled={!text.trim() || isSending}
        aria-label="Send message"
      >
        {isSending ? (
          <span className="chat-input__spinner" aria-hidden />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
