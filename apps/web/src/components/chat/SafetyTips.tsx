'use client';

interface SafetyTipsProps {
  onDismiss: () => void;
}

export function SafetyTips({ onDismiss }: SafetyTipsProps) {
  return (
    <div className="safety-banner" role="note">
      <p className="safety-banner__text">
        🛡️ <strong>Stay safe:</strong> Never share bank details or send money before meeting in person.
      </p>
      <button className="safety-banner__close" onClick={onDismiss} aria-label="Dismiss safety tips">
        ✕
      </button>
    </div>
  );
}
