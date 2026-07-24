import { cn } from "../utils";
import { AlertCircle } from "lucide-react";

export interface FormErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

export function FormError({ message, id, className }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className={cn("mt-1 text-xs font-medium text-destructive flex items-start gap-1.5", className)}>
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
