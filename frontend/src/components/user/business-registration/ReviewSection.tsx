import { Button } from "@/components/ui/button";
import { Edit } from "@/icons/IconRegistry";

interface ReviewSectionProps {
    title: string;
    content: string;
    onEdit: () => void;
}

export function ReviewSection({
    title,
    content,
    onEdit
}: ReviewSectionProps) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
            <div className="pr-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">{title}</h4>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">{content}</p>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="h-9 px-3 rounded-lg border-slate-200 text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-200 transition-all shrink-0"
            >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
            </Button>
        </div>
    );
}
