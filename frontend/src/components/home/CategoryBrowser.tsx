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
            className="py-12 md:py-16"
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
                <div className="mb-8">
                    <div>
                        <h2 id="browse-categories" className="text-xl font-bold md:text-3xl text-slate-900 tracking-tight">
                            Browse Categories
                        </h2>
                        <p className="mt-1 text-slate-500 text-sm hidden md:block">
                            Explore diverse categories to find exactly what you need.
                        </p>
                    </div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="
                        flex gap-4 md:gap-7
                        md:grid md:grid-cols-6 lg:grid-cols-8
                        overflow-x-auto snap-x snap-mandatory
                        pb-6 md:pb-2 scrollbar-hide
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
                                    className="group flex snap-start flex-col items-center justify-center gap-3 min-w-[90px] md:min-w-0"
                                >
                                    <div
                                        className={`
                                            flex h-16 w-16 md:h-20 md:w-20 items-center justify-center
                                            rounded-2xl transition-all duration-500
                                            ${config.bg}
                                            group-hover:scale-[1.15] group-hover:rotate-3
                                            group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]
                                            group-hover:shadow-current/10
                                            border border-white shadow-sm
                                        `}
                                    >
                                        <Icon className={`h-7 w-7 md:h-9 md:w-9 ${config.color} transition-colors group-hover:scale-110`} />
                                    </div>
                                    <span className="text-xs md:text-[13px] font-bold text-slate-600 text-center line-clamp-1 group-hover:text-green-600 transition-colors">
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
