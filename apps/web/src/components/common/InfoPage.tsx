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
        <article className="w-full py-4 md:py-6">
            <Container variant={containerVariant} className="space-y-6">
                <div className="border-b border-border pb-4">
                    <h1 className="text-h2 font-bold tracking-tight text-foreground">{title}</h1>
                    {lastUpdated && (
                        <p className="mt-1 text-caption text-foreground-subtle font-medium">Last updated: {lastUpdated}</p>
                    )}
                </div>
                {children}
            </Container>
        </article>
    );
}

