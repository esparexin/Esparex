"use client";

import { getCategoryVisual } from "@/config/categoryVisuals";
import type { CategoryVisual } from "@/config/categoryVisuals";
import Link from "next/link";
import type { Category } from "@/schemas";
import { motion } from "framer-motion";
import { buildPublicBrowseRoute } from "@/lib/publicBrowseRoutes";

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
            className="py-6 md:py-14"
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

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="
                        flex gap-3 md:gap-6
                        md:grid md:grid-cols-6 lg:grid-cols-8
                        overflow-x-auto snap-x snap-mandatory
                        pb-3 md:pb-2 scrollbar-hide
                        -mx-4 px-4 md:mx-0 md:px-0
                    "
                >
                    {displayCategories.map((cat) => {
                        const slug = cat.slug?.toLowerCase();

                        const config: CategoryVisual = getCategoryVisual(slug || cat.name || "");

                        const Icon = config.icon;

                        return (
                            <motion.div key={cat.id || cat.id} variants={itemVariants}>
                                <Link
                                    href={buildPublicBrowseRoute({ type: "ad", category: cat.slug || cat.id })}
                                    aria-label={`Browse ${cat.name}`}
                                    className="group flex snap-start flex-col items-center justify-center gap-2 min-w-[72px] md:min-w-0"
                                >
                                    <div
                                        className={`
                                            flex h-14 w-14 md:h-18 md:w-18 items-center justify-center
                                            rounded-2xl transition-all duration-300
                                            ${config.bg}
                                            group-hover:scale-110
                                            group-hover:shadow-lg
                                            border border-white/60 shadow-sm
                                        `}
                                    >
                                        <Icon className={`h-6 w-6 md:h-8 md:w-8 ${config.color}`} />
                                    </div>
                                    <span className="text-xs md:text-xs font-semibold text-muted-foreground text-center line-clamp-1 group-hover:text-link transition-colors">
                                        {cat.name}
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
