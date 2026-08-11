"use client";

import { getCategoryVisual } from "@/config/categoryVisuals";
import type { CategoryVisual } from "@/config/categoryVisuals";
import Link from "next/link";
import type { Category } from "@/schemas";
import { motion } from "framer-motion";
import { buildCategoryBrowseRoute } from "@/lib/publicBrowseRoutes";
import { cn } from "@/components/ui/utils";

interface CategoryBrowserProps {
    categories: Category[];
}

export function CategoryBrowser({ categories }: CategoryBrowserProps) {
    // Limit to exactly 10 categories to form a perfect 5x2 dashboard grid on mobile (and 1x10 row on desktop)
    const displayCategories = categories.length > 0 ? categories.slice(0, 10) : [];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <section
            role="region"
            aria-label="Popular Categories"
            aria-labelledby="browse-categories"
            className="py-4 md:py-8 relative overflow-hidden mesh-gradient-bg"
        >
            <div className="mx-auto max-w-7xl px-3 md:px-6 lg:px-8">
                <div className="mb-4 md:mb-8">
                    <h2 id="browse-categories" className="text-sm font-bold md:text-2xl text-foreground tracking-tight">
                        Browse Categories
                    </h2>
                    <p className="mt-1 text-foreground-subtle text-xs hidden md:block">
                        Explore diverse categories to find exactly what you need.
                    </p>
                </div>

                <div className="relative">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="
                            grid grid-cols-5 gap-1.5
                            md:grid-cols-6 lg:grid-cols-10 md:gap-5
                            w-full
                        "
                    >
                    {displayCategories.map((cat) => {
                        const slug = cat.slug?.toLowerCase();

                        const config: CategoryVisual = getCategoryVisual(slug || cat.name || "");

                        const Icon = config.icon;

                        return (
                            <motion.div key={cat.id} variants={itemVariants}>
                                <Link
                                    href={buildCategoryBrowseRoute(cat)}
                                    aria-label={`Browse ${cat.name}`}
                                    className="
                                        group flex flex-col items-center justify-center gap-2
                                        py-2.5 md:py-3.5 px-1.5 md:px-2 rounded-2xl hover:bg-slate-100/80
                                        transition-all duration-200 active:scale-95
                                        min-w-0 w-full cursor-pointer
                                    "
                                >
                                    <div
                                        className={cn(
                                            "flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-2xl transition-all duration-300 shadow-2xs border border-slate-200/60",
                                            config.bg || "bg-slate-50",
                                            "group-hover:scale-105 group-hover:shadow-xs"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 group-hover:scale-110",
                                                config.color || "text-slate-500"
                                            )}
                                            aria-hidden="true"
                                            focusable="false"
                                        />
                                    </div>
                                    <span className="w-full truncate text-tiny md:text-xs font-semibold text-slate-800 text-center group-hover:text-blue-600 transition-colors">
                                        {cat.name}
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
                </div>
            </div>
        </section>
    );
}
