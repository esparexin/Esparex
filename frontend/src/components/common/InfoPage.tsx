interface InfoPageProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

export function InfoPage({ title, lastUpdated, children }: InfoPageProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Simple Header */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
                    <h1 className="font-bold text-lg">{title}</h1>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
                <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 prose prose-slate max-w-none">
                    {lastUpdated && (
                        <p className="text-sm text-muted-foreground mb-6">Last Updated: {lastUpdated}</p>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
