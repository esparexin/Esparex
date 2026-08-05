import * as React from "react";
import { cn } from "../utils";

export const InputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex items-center w-full group/input-group", className)}
        {...props}
      />
    );
  }
);
InputGroup.displayName = "InputGroup";

export interface InputAdornmentProps extends React.HTMLAttributes<HTMLDivElement> {
  position: "start" | "end";
}

export const InputAdornment = React.forwardRef<HTMLDivElement, InputAdornmentProps>(
  ({ className, position, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-y-0 flex items-center justify-center text-foreground-subtle z-10 transition-colors group-focus-within/input-group:text-foreground",
          position === "start" ? "left-0 pl-3 pr-2" : "right-0 pr-3 pl-2",
          className
        )}
        {...props}
      />
    );
  }
);
InputAdornment.displayName = "InputAdornment";

export const InputPrefix = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <InputAdornment ref={ref} position="start" {...props} />
);
InputPrefix.displayName = "InputPrefix";

export const InputSuffix = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <InputAdornment ref={ref} position="end" {...props} />
);
InputSuffix.displayName = "InputSuffix";
