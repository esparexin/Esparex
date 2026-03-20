import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit } from "@/icons/IconRegistry";

interface CompletedStepCardProps {
    title: string;
    summary: string;
    onEdit: () => void;
}

export function CompletedStepCard({
    title,
    summary,
    onEdit
}: CompletedStepCardProps) {
    return (
        <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 leading-none mb-1">{title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-1">{summary}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-10 px-4 rounded-xl text-emerald-700 hover:bg-emerald-100/50 font-bold"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Change
                </Button>
            </CardContent>
        </Card>
    );
}
