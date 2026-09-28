"use client";

import { useEffect, useState } from "react";
import {
    type EmailTemplateCustomization,
    type EmailTemplateDTO,
    type UpdateEmailTemplatePayload,
} from "@esparex/contracts";
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Badge,
    Input,
    Textarea,
    Label,
    Spinner,
    Send,
    RotateCcw,
} from "@esparex/ui";

interface EmailTemplateEditorModalProps {
    template: EmailTemplateDTO | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: EmailTemplateDTO["key"], payload: UpdateEmailTemplatePayload) => Promise<boolean>;
    onReset: (key: EmailTemplateDTO["key"]) => Promise<boolean>;
    onSendTest: (
        key: EmailTemplateDTO["key"],
        recipientEmail: string,
        customization?: Partial<EmailTemplateCustomization>
    ) => Promise<boolean>;
}

export function EmailTemplateEditorModal({
    template,
    isOpen,
    onClose,
    onSave,
    onReset,
    onSendTest,
}: EmailTemplateEditorModalProps) {
    const [subject, setSubject] = useState("");
    const [customHeadline, setCustomHeadline] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [testEmail, setTestEmail] = useState("");
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);

    useEffect(() => {
        if (template) {
            setSubject(template.customSubject || template.defaultSubject || "");
            setCustomHeadline(template.customHeadline || "");
            setCustomNote(template.customNote || "");
        }
    }, [template]);

    if (!template) return null;

    const handleCopyVariable = (varName: string) => {
        void navigator.clipboard.writeText(`{{${varName}}}`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const success = await onSave(template.key, {
            subject: subject.trim(),
            customHeadline: customHeadline.trim() || undefined,
            customNote: customNote.trim() || undefined,
        });
        setSaving(false);
        if (success) onClose();
    };

    const handleReset = async () => {
        setResetting(true);
        const success = await onReset(template.key);
        setResetting(false);
        if (success) onClose();
    };

    const handleTest = async () => {
        if (!testEmail || !testEmail.includes("@")) return;
        setSendingTest(true);
        await onSendTest(template.key, testEmail.trim(), {
            subject: subject.trim() || undefined,
            customHeadline: customHeadline.trim() || undefined,
            customNote: customNote.trim() || undefined,
        });
        setSendingTest(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-5 border-b border-border bg-card/60 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <DialogTitle className="text-body-lg font-semibold text-foreground">
                            Customize: {template.name}
                        </DialogTitle>
                        <Badge variant="secondary" className="text-caption uppercase">
                            {template.category}
                        </Badge>
                    </div>
                    <DialogDescription className="text-caption text-muted-foreground mt-1">
                        Configure custom subject lines, headline overlays, and footer notes for this email template.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Trigger hint */}
                    <div className="bg-muted/40 border border-border rounded-lg p-3 text-caption text-muted-foreground">
                        <span className="font-semibold text-foreground">Trigger Event:</span> {template.trigger}
                    </div>

                    {/* Subject Line Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="template-subject" className="text-caption font-semibold text-foreground">
                                Subject Line *
                            </Label>
                            <span className="text-tiny text-muted-foreground">
                                {subject.length}/200
                            </span>
                        </div>
                        <Input
                            id="template-subject"
                            value={subject}
                            maxLength={200}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder={template.defaultSubject}
                            className="text-body-lg md:text-body"
                            required
                        />
                        <p className="text-tiny text-muted-foreground">
                            Default: <span className="font-mono text-foreground/80">{template.defaultSubject}</span>
                        </p>
                    </div>

                    {/* Available Template Variables */}
                    {template.variables && template.variables.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-caption font-semibold text-foreground">
                                Available Dynamic Variables (Click to copy)
                            </Label>
                            <div className="flex flex-wrap gap-1.5 p-2.5 bg-muted/30 border border-border rounded-lg">
                                {template.variables.map((v) => (
                                    <button
                                        key={v.name}
                                        type="button"
                                        onClick={() => handleCopyVariable(v.name)}
                                        title={`${v.description} (Example: ${v.example})`}
                                        className="text-caption font-mono bg-background hover:bg-primary/10 hover:border-primary/40 border border-border px-2 py-1 rounded transition-colors text-foreground cursor-pointer"
                                    >
                                        &#123;&#123;{v.name}&#125;&#125;
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Optional Custom Headline */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="template-headline" className="text-caption font-semibold text-foreground">
                                Custom Primary Headline (Optional)
                            </Label>
                            <span className="text-tiny text-muted-foreground">
                                {customHeadline.length}/200
                            </span>
                        </div>
                        <Input
                            id="template-headline"
                            value={customHeadline}
                            maxLength={200}
                            onChange={(e) => setCustomHeadline(e.target.value)}
                            placeholder="Leave empty to use system default headline"
                            className="text-body-lg md:text-body"
                        />
                    </div>

                    {/* Optional Custom Note */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="template-note" className="text-caption font-semibold text-foreground">
                                Custom Body / Footer Note (Optional)
                            </Label>
                            <span className="text-tiny text-muted-foreground">
                                {customNote.length}/500
                            </span>
                        </div>
                        <Textarea
                            id="template-note"
                            value={customNote}
                            maxLength={500}
                            rows={3}
                            onChange={(e) => setCustomNote(e.target.value)}
                            placeholder="Leave empty to use system default note"
                            className="text-body-lg md:text-body"
                        />
                    </div>

                    {/* Send Test Section */}
                    <div className="border border-border/80 rounded-lg p-3.5 bg-muted/20 space-y-2.5">
                        <Label htmlFor="test-recipient" className="text-caption font-semibold text-foreground">
                            Dispatch Live Test Email
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="test-recipient"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="admin@esparex.in"
                                className="text-body-lg md:text-body flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleTest}
                                disabled={sendingTest || !testEmail || !testEmail.includes("@")}
                                className="gap-1.5 text-caption h-9 px-3 flex-shrink-0"
                            >
                                {sendingTest ? (
                                    <Spinner className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                <span>Send Test</span>
                            </Button>
                        </div>
                    </div>

                    {/* Dialog Footer Actions */}
                    <DialogFooter className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
                        {template.isCustomized ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                disabled={resetting || saving}
                                className="text-destructive hover:bg-destructive/10 gap-1.5 text-caption w-full sm:w-auto"
                            >
                                {resetting ? (
                                    <Spinner className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                <span>Restore System Defaults</span>
                            </Button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                disabled={saving || resetting}
                                className="text-caption"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={saving || resetting}
                                className="text-caption gap-1.5"
                            >
                                {saving && <Spinner className="w-3.5 h-3.5 animate-spin" />}
                                <span>Save Customization</span>
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
