import { Container } from "@esparex/ui";

interface InfoPageProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

/**
 * InfoPage wrapper for public content routes.
 * Uses a flat Container layout without heavy artificial card borders.
 */
export function InfoPage({ title, lastUpdated, children }: InfoPageProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <article className="flex-1 w-full py-6 md:py-10">
                <Container variant="sm" className="space-y-6">
                    <div className="border-b border-slate-200 pb-4">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                        {lastUpdated && (
                            <p className="mt-1 text-xs text-slate-500 font-medium">Last updated: {lastUpdated}</p>
                        )}
                    </div>
                    {children}
                </Container>
            </article>
        </div>
    );
}

