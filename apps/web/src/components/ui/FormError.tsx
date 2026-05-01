import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

export function FormError({ message, id, className }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className={cn("mt-1 text-xs font-medium text-destructive", className)}>
      {message}
    </p>
  );
}
