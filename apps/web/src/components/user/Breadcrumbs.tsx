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
    <nav className="w-full px-3 md:px-6 lg:px-8 py-2.5 bg-slate-50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center gap-1.5 text-tiny sm:text-xs font-normal flex-wrap">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5 group">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
              )}
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="text-slate-500 hover:text-slate-900 transition-colors font-normal truncate max-w-[120px] sm:max-w-[180px]"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-slate-700 font-normal truncate max-w-[130px] sm:max-w-[200px]">
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
