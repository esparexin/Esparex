interface InfoPageProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

export function InfoPage({ title, lastUpdated, children }: InfoPageProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 md:py-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-8 prose prose-slate max-w-none">
                    <div className="mb-6 md:mb-8 not-prose border-b border-slate-100 pb-5">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                        {lastUpdated && (
                            <p className="mt-1.5 text-xs text-foreground-subtle font-medium">Last updated: {lastUpdated}</p>
                        )}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
