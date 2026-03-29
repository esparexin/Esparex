interface InfoPageProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

export function InfoPage({ title, lastUpdated, children }: InfoPageProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 prose prose-slate max-w-none">
                    <div className="mb-8 not-prose">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
                        {lastUpdated && (
                            <p className="mt-2 text-sm text-muted-foreground">Last Updated: {lastUpdated}</p>
                        )}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
