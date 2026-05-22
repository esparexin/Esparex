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
            className="py-6 md:py-16 relative overflow-hidden mesh-gradient-bg"
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
                                        group flex flex-col items-center justify-center gap-1.5 
                                        h-[76px] md:h-32 rounded-lg md:rounded-[20px] border border-slate-100 bg-white/95 
                                        shadow-[0_1px_4px_rgba(15,23,42,0.01)] hover:shadow-premium-hover 
                                        transition-all duration-300 hover:border-slate-200/80 hover:-translate-y-0.5 
                                        active:scale-[0.98] p-1.5 md:p-4 min-w-0 w-full
                                    "
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-lg md:rounded-xl transition-all duration-500",
                                            config.bg || "bg-slate-50",
                                            "group-hover:scale-105"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "h-4 w-4 md:h-6 md:w-6 transition-transform duration-500 group-hover:rotate-6",
                                                config.color || "text-slate-500"
                                            )}
                                            aria-hidden="true"
                                            focusable="false"
                                        />
                                    </div>
                                    <span className="w-full truncate text-[10px] md:text-[13px] font-bold text-slate-700 text-center group-hover:text-blue-600 transition-colors">
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
