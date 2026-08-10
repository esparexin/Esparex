"use client";
import { ChevronRight } from "@/icons/IconRegistry";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="w-full px-3 md:px-6 lg:px-8 py-3.5 md:py-4 bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center gap-2 text-tiny sm:text-xs font-normal flex-wrap">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2 group">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
              )}
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium truncate max-w-[120px] sm:max-w-[180px]"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-foreground font-semibold truncate max-w-[130px] sm:max-w-[200px]">
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
