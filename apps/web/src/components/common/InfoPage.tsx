import { Container } from "@esparex/ui";

interface InfoPageProps {
    title: string;
    lastUpdated?: string;
    containerVariant?: "sm" | "md" | "lg" | "xl" | "full";
    children: React.ReactNode;
}

/**
 * InfoPage wrapper for public content routes.
 * Uses a flat Container layout without heavy artificial card borders.
 */
export function InfoPage({ title, lastUpdated, containerVariant = "sm", children }: InfoPageProps) {
    return (
        <main id="main-content" tabIndex={-1} className="w-full focus:outline-hidden">
            <article className="w-full py-4 md:py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
                <Container variant={containerVariant} className="space-y-6 md:space-y-8">
                    <header className="border-b border-border pb-4 md:pb-5">
                        <h1 className="text-h2 font-bold tracking-tight text-foreground">{title}</h1>
                        {lastUpdated && (
                            <p className="mt-1.5 text-caption text-foreground-subtle font-medium">
                                Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
                            </p>
                        )}
                    </header>
                    {children}
                </Container>
            </article>
        </main>
    );
}

