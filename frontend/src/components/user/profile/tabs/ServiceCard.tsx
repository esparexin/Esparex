import Link from "next/link";
import { Wrench, Edit, Trash2, CheckSquare, PowerOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

export function ServiceCard({
    service,
    onDelete,
    onMarkSold,
    onDeactivate,
    getStatusBadge,
}: {
    service: any;
    onDelete: () => void;
    onMarkSold?: () => void;
    onDeactivate?: () => void;
    getStatusBadge?: (status: string) => React.ReactNode;
}) {
    const timeAgo = service.createdAt
        ? formatDistanceToNow(new Date(service.createdAt), { addSuffix: true })
        : "";

    const thumbnail = service.images?.[0];
    const isLive = service.status === "live";

    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center">
                {thumbnail ? (
                    <img src={thumbnail} alt={service.title} className="w-full h-full object-cover" />
                ) : (
                    <Wrench className="w-8 h-8 text-blue-300" />
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 truncate">{service.title}</p>
                    {getStatusBadge ? getStatusBadge(service.status) : (
                        <span className="text-xs text-slate-500">{service.status}</span>
                    )}
                </div>
                {service.price != null && (
                    <p className="text-sm font-bold text-blue-700 mt-1">₹{service.price.toLocaleString()}</p>
                )}
                {service.location?.city && (
                    <p className="text-xs text-slate-400 mt-0.5">{service.location.city}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {isLive && onMarkSold && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={onMarkSold}
                        title="Mark as Sold"
                    >
                        <CheckSquare className="h-4 w-4" />
                    </Button>
                )}
                {isLive && onDeactivate && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        onClick={onDeactivate}
                        title="Deactivate"
                    >
                        <PowerOff className="h-4 w-4" />
                    </Button>
                )}
                <Link href={`/edit-service/${service.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
