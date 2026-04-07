import type { ReactNode } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewSectionProps {
    title: string;
    content: ReactNode;
    onEdit: () => void;
}

export function ReviewSection({
    title,
    content,
    onEdit,
}: ReviewSectionProps) {
    return (
        <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
                        {title}
                    </h4>
                    <div className="mt-3 space-y-2">{content}</div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="h-11 shrink-0 rounded-lg border-slate-200 px-3 text-link hover:bg-blue-50 hover:border-blue-200"
                >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                </Button>
            </div>
        </div>
    );
}
