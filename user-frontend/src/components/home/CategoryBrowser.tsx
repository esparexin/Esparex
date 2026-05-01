"use client";

import { getCategoryVisual } from "@/config/categoryVisuals";
import type { CategoryVisual } from "@/config/categoryVisuals";
import Link from "next/link";
import type { Category } from "@/schemas";
import { motion } from "framer-motion";
import { buildCategoryBrowseRoute } from "@/lib/publicBrowseRoutes";

interface CategoryBrowserProps {
    categories: Category[];
}

export function CategoryBrowser({ categories }: CategoryBrowserProps) {
    const displayCategories = categories.length > 0 ? categories : [];

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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <section
            role="region"
            aria-label="Popular Categories"
            aria-labelledby="browse-categories"
            className="py-8 md:py-16 relative overflow-hidden mesh-gradient-bg"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <div className="mb-5 md:mb-8">
                    <h2 id="browse-categories" className="text-base font-bold md:text-2xl text-foreground tracking-tight">
                        Browse Categories
                    </h2>
                    <p className="mt-1 text-foreground-subtle text-xs hidden md:block">
                        Explore diverse categories to find exactly what you need.
                    </p>
                </div>

                <div className="relative group/scroll">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="
                            flex gap-4 md:gap-6
                            md:grid md:grid-cols-6 lg:grid-cols-8
                            overflow-x-auto snap-x snap-mandatory
                            pb-4 md:pb-2 scrollbar-hide
                            w-full scroll-px-4
                        "
                    >
                    {displayCategories.map((cat) => {
                        const slug = cat.slug?.toLowerCase();

                        const config: CategoryVisual = getCategoryVisual(slug || cat.name || "");

                        const Icon = config.icon;

                        return (
                            <motion.div key={cat.id || cat.id} variants={itemVariants}>
                                <Link
                                    href={buildCategoryBrowseRoute(cat)}
                                    aria-label={`Browse ${cat.name}`}
                                    className="group flex snap-start flex-col items-center justify-center gap-2 min-w-[72px] md:min-w-0"
                                >
                                    <div
                                        className={`
                                            flex h-16 w-16 md:h-20 md:w-20 items-center justify-center
                                            rounded-[22px] transition-all duration-500
                                            ${config.bg}
                                            glass
                                            group-hover:scale-105
                                            group-hover:shadow-premium-hover
                                            group-active:scale-95
                                            border-white shadow-premium
                                        `}
                                    >
                                        <Icon className={`h-7 w-7 md:h-9 md:w-9 ${config.color} transition-transform duration-500 group-hover:rotate-6`} />
                                    </div>
                                    <span className="text-[11px] md:text-sm font-bold text-foreground-tertiary text-center line-clamp-1 group-hover:text-primary transition-colors mt-1">
                                        {cat.name}
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
                {/* Mobile Scroll Indicator Fade */}
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background/40 to-transparent pointer-events-none md:hidden" />
                </div>
            </div>
        </section>
    );
}
