'use client';

const DEFAULT_REPLIES = [
  'Is this still available?',
  'What is the final price?',
  'Can you deliver?',
  'Can you share more photos?',
];

interface QuickRepliesProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="w-full py-1.5 px-3" aria-label="Quick reply suggestions">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {DEFAULT_REPLIES.map((reply) => (
          <button
            key={reply}
            className="inline-flex items-center shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 active:scale-95 transition-all shadow-2xs whitespace-nowrap"
            onClick={() => onSelect(reply)}
            disabled={disabled}
            type="button"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
