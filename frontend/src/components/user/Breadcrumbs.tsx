"use client";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="w-full px-4 md:px-6 lg:px-8 py-3 bg-muted/30 backdrop-blur-md border-b border-border/40 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-widest flex-wrap">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2 group">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
              )}
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="text-muted-foreground hover:text-primary transition-colors font-medium truncate max-w-[150px] md:max-w-[200px]"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-foreground font-semibold truncate max-w-[150px] md:max-w-[200px]">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
