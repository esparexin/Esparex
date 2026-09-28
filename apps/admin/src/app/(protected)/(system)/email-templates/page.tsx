"use client";

import { useMemo, useState } from "react";
import {
    EMAIL_TEMPLATE_CATEGORY,
    type EmailTemplateCategory,
    type EmailTemplateDTO,
} from "@esparex/contracts";
import {
    Button,
    Card,
    Grid,
    Input,
    Mail,
    RefreshCw,
    Search,
    Sparkles,
    Spinner,
    Stack,
} from "@esparex/ui";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { notificationsTabs } from "@/components/layout/adminModuleTabSets";
import { useAdminEmailTemplates } from "@/hooks/useAdminEmailTemplates";
import { EmailTemplateTable } from "./components/EmailTemplateTable";
import { EmailTemplatePreviewModal } from "./components/EmailTemplatePreviewModal";
import { EmailTemplateEditorModal } from "./components/EmailTemplateEditorModal";

const CATEGORIES: Array<EmailTemplateCategory | "ALL"> = [
    "ALL",
    EMAIL_TEMPLATE_CATEGORY.LISTINGS,
    EMAIL_TEMPLATE_CATEGORY.BUSINESSES,
    EMAIL_TEMPLATE_CATEGORY.BILLING,
    EMAIL_TEMPLATE_CATEGORY.AUTHENTICATION,
    EMAIL_TEMPLATE_CATEGORY.SYSTEM,
];

export default function EmailTemplatesPage() {
    const {
        templates,
        loading,
        refreshing,
        error,
        loadTemplates,
        updateTemplate,
        resetTemplate,
        getPreview,
        sendTestEmail,
    } = useAdminEmailTemplates();

    const [selectedCategory, setSelectedCategory] = useState<EmailTemplateCategory | "ALL">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplateDTO | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplateDTO | null>(null);

    // Filter templates by category and search term
    const filteredTemplates = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return templates.filter((tpl) => {
            const matchesCategory =
                selectedCategory === "ALL" || tpl.category === selectedCategory;
            if (!matchesCategory) return false;

            if (!query) return true;
            return (
                tpl.name.toLowerCase().includes(query) ||
                tpl.key.toLowerCase().includes(query) ||
                tpl.subject.toLowerCase().includes(query) ||
                tpl.trigger.toLowerCase().includes(query)
            );
        });
    }, [templates, selectedCategory, searchQuery]);

    // Statistics
    const stats = useMemo(() => {
        const total = templates.length;
        const customized = templates.filter((t) => t.isCustomized).length;
        const systemDefault = total - customized;
        return { total, customized, systemDefault };
    }, [templates]);

    return (
        <AdminPageShell
            title="Email Templates"
            description="Preview and customize canonical system and transactional email templates across the Esparex platform."
            tabs={<AdminModuleTabs tabs={notificationsTabs} />}
            actions={
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void loadTemplates(true)}
                    disabled={refreshing || loading}
                    className="h-8 px-3 text-caption gap-1.5"
                    aria-label="Refresh email templates"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                </Button>
            }
        >
            <Stack gap="md">
                {/* Stats Summary Bar */}
                <Grid cols={3} gap="sm">
                    <Card className="p-4 border border-border bg-card/60 flex items-center justify-between">
                        <div>
                            <p className="text-caption text-muted-foreground font-medium">Total Templates</p>
                            <p className="text-h3 font-bold text-foreground mt-0.5">{stats.total}</p>
                        </div>
                        <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                            <Mail className="w-5 h-5" />
                        </div>
                    </Card>

                    <Card className="p-4 border border-border bg-card/60 flex items-center justify-between">
                        <div>
                            <p className="text-caption text-muted-foreground font-medium">Custom Overlays</p>
                            <p className="text-h3 font-bold text-foreground mt-0.5">{stats.customized}</p>
                        </div>
                        <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </Card>

                    <Card className="p-4 border border-border bg-card/60 flex items-center justify-between">
                        <div>
                            <p className="text-caption text-muted-foreground font-medium">System Defaults</p>
                            <p className="text-h3 font-bold text-foreground mt-0.5">{stats.systemDefault}</p>
                        </div>
                        <div className="p-2.5 rounded-full bg-muted text-muted-foreground">
                            <Mail className="w-5 h-5" />
                        </div>
                    </Card>
                </Grid>

                {/* Filter and Search Controls */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Category Filter Chips */}
                    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Template categories">
                        {CATEGORIES.map((cat) => (
                            <Button
                                key={cat}
                                type="button"
                                size="sm"
                                variant={selectedCategory === cat ? "default" : "outline"}
                                onClick={() => setSelectedCategory(cat)}
                                className="h-8 px-3 text-caption"
                                role="tab"
                                aria-selected={selectedCategory === cat}
                            >
                                {cat === "ALL" ? "All Categories" : cat}
                            </Button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates or subjects..."
                            className="pl-9 text-body-lg md:text-body h-8"
                            aria-label="Search email templates"
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                {loading ? (
                    <Card className="p-16 text-center border border-border bg-card/60 flex flex-col items-center justify-center gap-3">
                        <Spinner className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-caption text-muted-foreground">Loading email template catalog...</span>
                    </Card>
                ) : error ? (
                    <Card className="p-8 text-center border border-destructive/30 bg-destructive/5 space-y-3">
                        <p className="text-body font-semibold text-destructive">{error}</p>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void loadTemplates()}
                            className="text-caption"
                        >
                            Try Again
                        </Button>
                    </Card>
                ) : (
                    <EmailTemplateTable
                        templates={filteredTemplates}
                        onPreview={(tpl) => setPreviewingTemplate(tpl)}
                        onEdit={(tpl) => setEditingTemplate(tpl)}
                        onReset={(key) => void resetTemplate(key)}
                    />
                )}
            </Stack>

            {/* Preview Modal */}
            <EmailTemplatePreviewModal
                template={previewingTemplate}
                isOpen={Boolean(previewingTemplate)}
                onClose={() => setPreviewingTemplate(null)}
                onGetPreview={getPreview}
            />

            {/* Editor Modal */}
            <EmailTemplateEditorModal
                template={editingTemplate}
                isOpen={Boolean(editingTemplate)}
                onClose={() => setEditingTemplate(null)}
                onSave={updateTemplate}
                onReset={resetTemplate}
                onSendTest={sendTestEmail}
            />
        </AdminPageShell>
    );
}
