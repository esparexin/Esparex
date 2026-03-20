import { AlertTriangle } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="w-full py-2 px-4 flex items-center gap-2 bg-red-600 text-white rounded-md mb-4">
      <AlertTriangle size={18} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
