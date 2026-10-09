"use client";

import { getCategoryVisual } from "@/config/categoryVisuals";
import type { CategoryVisual } from "@/config/categoryVisuals";
import Link from "next/link";
import type { Category } from "@esparex/contracts";
import { buildCategoryBrowseRoute } from "@/lib/publicBrowseRoutes";
import { cn } from "@/lib/utils";

interface CategoryBrowserProps {
    categories: Category[];
}

export function CategoryBrowser({ categories }: CategoryBrowserProps) {
    // Limit to exactly 10 categories to form a perfect 5x2 dashboard grid on mobile (and 1x10 row on desktop)
    const displayCategories = categories.length > 0 ? categories.slice(0, 10) : [];

    return (
        <section
            role="region"
            aria-label="Categories"
            aria-labelledby="browse-categories"
            className="pt-3 pb-1 md:pt-5 md:pb-2 relative"
        >
            <div className="mx-auto max-w-7xl px-3 md:px-6 lg:px-8">
                <div className="mb-2 md:mb-3">
                    <h2 id="browse-categories" className="text-body sm:text-body-lg md:text-h4 font-bold text-foreground tracking-tight">
                        Categories
                    </h2>
                </div>

                <div className="relative">
                    <div
                        className="
                            grid grid-cols-5 gap-1.5
                            sm:flex sm:flex-wrap sm:items-center sm:justify-start sm:gap-2.5 md:gap-3.5
                            w-full
                        "
                    >
                    {displayCategories.map((cat, index) => {
                        const slug = cat.slug?.toLowerCase();

                        const config: CategoryVisual = getCategoryVisual(slug || cat.name || "");

                        const Icon = config.icon;

                        return (
                            <div
                                key={cat.id}
                                className="animate-fade-in-up"
                                /* design-token-ignore: staggered entrance delay computed per index */
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Link
                                    href={buildCategoryBrowseRoute(cat)}
                                    aria-label={`Browse ${cat.name}`}
                                    className="
                                        group flex flex-col items-center justify-center gap-1.5
                                        py-1.5 md:py-2 px-1.5 md:px-2.5 rounded-xl hover:bg-muted/80
                                        transition-all duration-200 active:scale-95
                                        min-w-0 sm:w-20 md:w-[88px] cursor-pointer
                                    "
                                >
                                    <div
                                        className={cn(
                                            "flex h-[34px] w-[34px] md:h-[38px] md:w-[38px] items-center justify-center rounded-xl transition-all duration-300 shadow-sm border border-border/60",
                                            config.bg || "bg-muted/40",
                                            "group-hover:scale-105 group-hover:shadow-sm"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "h-4 w-4 md:h-[18px] md:w-[18px] transition-transform duration-300 group-hover:scale-110",
                                                config.color || "text-foreground-subtle"
                                            )}
                                            aria-hidden="true"
                                            focusable="false"
                                        />
                                    </div>
                                    <span className="w-full truncate text-tiny font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                                        {cat.name}
                                    </span>
                                </Link>
                            </div>
                        );
                    })}
                </div>
                </div>
            </div>
        </section>
    );
}
