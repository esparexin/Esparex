import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function TitleAndMetricsSkeleton({ isDesktop = false }: { isDesktop?: boolean }) {
    return (
        <>
            <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className={isDesktop ? "h-12 w-1/2" : "h-10 w-1/2"} />
            <div className="grid grid-cols-2 gap-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        </>
    );
}

export function AdDetailSkeleton() {
    return (
        <div className="bg-gray-50 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto md:px-6 lg:px-8 md:py-6">
                {/* Breadcrumb Skeleton */}
                <div className="flex gap-2 mb-4 px-4 md:px-0">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6">
                    {/* Main Content Skeleton */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Image Slider Skeleton */}
                        <Card className="rounded-none md:rounded-lg overflow-hidden border-0 md:border">
                            <Skeleton className="aspect-[16/10] w-full" />
                            {/* Thumbnails */}
                            <div className="hidden md:flex gap-2 p-3 bg-white">
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <Skeleton className="w-20 h-20 rounded-xl" />
                            </div>
                        </Card>

                        {/* Mobile Title Skeleton */}
                        <Card className="md:hidden rounded-none border-x-0">
                            <CardContent className="p-4 space-y-3">
                                <TitleAndMetricsSkeleton />
                            </CardContent>
                        </Card>

                        {/* Description Skeleton */}
                        <Card className="rounded-none md:rounded-lg border-x-0 md:border">
                            <CardContent className="p-4 md:p-6 space-y-4">
                                <Skeleton className="h-6 w-32" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-4 p-4 md:p-0">
                        {/* Desktop Title & Actions Skeleton */}
                        <Card className="hidden md:block">
                            <CardContent className="p-5 space-y-4">
                                <TitleAndMetricsSkeleton isDesktop />
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </CardContent>
                        </Card>

                        {/* Seller Info Skeleton */}
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Safety Tips Skeleton */}
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
