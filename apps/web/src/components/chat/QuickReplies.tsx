'use client';

const DEFAULT_REPLIES = [
  'Is this still available?',
  'What is the final price?',
  'Can you deliver?',
  'Is there any discount?',
  "I'm interested, let's meet.",
  'Can you share more photos?',
];

interface QuickRepliesProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="quick-replies" aria-label="Quick reply suggestions">
      {DEFAULT_REPLIES.map((reply) => (
        <button
          key={reply}
          className="quick-replies__chip"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          type="button"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
