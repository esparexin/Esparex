import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display",
        "text-h1",
        "text-h2",
        "text-h3",
        "text-h4",
        "text-body-lg",
        "text-body",
        "text-small",
        "text-caption",
        "text-tiny"
      ],
      "text-color": [
        "text-foreground-secondary",
        "text-foreground-tertiary",
        "text-foreground-subtle",
        "text-link",
        "text-link-dark",
        "text-link-foreground"
      ],
      "bg-color": [
        "bg-foreground-secondary",
        "bg-foreground-tertiary",
        "bg-foreground-subtle",
        "bg-link",
        "bg-link-dark",
        "bg-link-foreground"
      ],
      "border-color": [
        "border-border",
        "border-foreground-secondary",
        "border-foreground-tertiary",
        "border-foreground-subtle",
        "border-link",
        "border-link-dark"
      ],
      shadow: [
        "shadow-2xs",
        "shadow-xs",
        "shadow-premium",
        "shadow-subtle",
        "shadow-elevated"
      ]
    }
  }
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
