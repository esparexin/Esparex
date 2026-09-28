"use client";

import {
    EMAIL_TEMPLATE_CATEGORY,
    type EmailTemplateCategory,
    type EmailTemplateDTO,
} from "@esparex/contracts";
import {
    Button,
    Badge,
    Card,
    Eye,
    Edit2,
    RotateCcw,
    Sparkles,
} from "@esparex/ui";

interface EmailTemplateTableProps {
    templates: EmailTemplateDTO[];
    onPreview: (template: EmailTemplateDTO) => void;
    onEdit: (template: EmailTemplateDTO) => void;
    onReset: (key: EmailTemplateDTO["key"]) => void;
}

const getCategoryBadgeVariant = (category: EmailTemplateCategory) => {
    switch (category) {
        case EMAIL_TEMPLATE_CATEGORY.LISTINGS:
            return "secondary";
        case EMAIL_TEMPLATE_CATEGORY.BUSINESSES:
            return "default";
        case EMAIL_TEMPLATE_CATEGORY.BILLING:
            return "outline";
        case EMAIL_TEMPLATE_CATEGORY.AUTHENTICATION:
            return "secondary";
        case EMAIL_TEMPLATE_CATEGORY.SYSTEM:
            return "outline";
        default:
            return "secondary";
    }
};

export function EmailTemplateTable({
    templates,
    onPreview,
    onEdit,
    onReset,
}: EmailTemplateTableProps) {
    if (templates.length === 0) {
        return (
            <Card className="p-12 text-center border-dashed border-border bg-card/40">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-body font-medium text-foreground">No email templates match the current filter</p>
                    <p className="text-caption text-muted-foreground">Try clearing the search query or changing the category filter.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border border-border overflow-hidden bg-card/60">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-caption">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                            <th className="py-3 px-4">Template</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 hidden md:table-cell">Trigger Event</th>
                            <th className="py-3 px-4 hidden lg:table-cell">Active Subject</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {templates.map((tpl) => (
                            <tr
                                key={tpl.key}
                                className="hover:bg-muted/30 transition-colors focus-within:bg-muted/40"
                            >
                                {/* Template Name & Key */}
                                <td className="py-3 px-4">
                                    <div className="font-semibold text-foreground text-body">
                                        {tpl.name}
                                    </div>
                                    <div className="font-mono text-tiny text-muted-foreground mt-0.5">
                                        {tpl.key}
                                    </div>
                                    <div className="text-caption text-muted-foreground mt-1 line-clamp-1 md:hidden">
                                        {tpl.trigger}
                                    </div>
                                </td>

                                {/* Category */}
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <Badge
                                        variant={getCategoryBadgeVariant(tpl.category)}
                                        className="text-tiny uppercase font-bold tracking-wider"
                                    >
                                        {tpl.category}
                                    </Badge>
                                </td>

                                {/* Trigger */}
                                <td className="py-3 px-4 hidden md:table-cell text-muted-foreground max-w-xs">
                                    <span className="line-clamp-2">{tpl.trigger}</span>
                                </td>

                                {/* Active Subject */}
                                <td className="py-3 px-4 hidden lg:table-cell text-foreground font-medium max-w-xs">
                                    <span className="truncate block" title={tpl.subject}>
                                        {tpl.subject}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                    {tpl.isCustomized ? (
                                        <Badge
                                            variant="outline"
                                            className="border-primary/40 text-primary text-tiny gap-1 py-0.5"
                                        >
                                            <Sparkles className="w-2.5 h-2.5" />
                                            <span>Custom</span>
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-tiny">
                                            System Default
                                        </span>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onPreview(tpl)}
                                            className="h-8 px-2.5 text-caption gap-1"
                                            aria-label={`Preview ${tpl.name}`}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Preview</span>
                                        </Button>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEdit(tpl)}
                                            className="h-8 px-2.5 text-caption gap-1"
                                            aria-label={`Customize ${tpl.name}`}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Edit</span>
                                        </Button>

                                        {tpl.isCustomized && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onReset(tpl.key)}
                                                className="h-8 px-2 text-caption text-muted-foreground hover:text-destructive"
                                                title="Reset to system defaults"
                                                aria-label={`Reset ${tpl.name} to system defaults`}
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
