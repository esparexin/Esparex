import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    const reactId = React.useId().replace(/:/g, "");
    const resolvedId = props.id ?? props.name ?? `textarea-${reactId}`;
    const resolvedName = props.name ?? props.id ?? resolvedId;

    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
        id={resolvedId}
        name={resolvedName}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
