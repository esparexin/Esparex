export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                {/* Spinner */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>

                {/* Loading Text */}
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Loading...
                </h2>
                <p className="text-slate-600">
                    Please wait while we load your content
                </p>

                {/* Logo */}
                <div className="mt-8">
                    <div className="flex items-center gap-2 justify-center">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">E</span>
                        </div>
                        <span className="text-lg font-bold text-primary">Esparex</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
