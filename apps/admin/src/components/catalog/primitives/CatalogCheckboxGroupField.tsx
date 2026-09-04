"use client";

export function CatalogCheckboxGroupField({
    label, options, selectedValues, onChange, columns = 1,
}: {
    label: string; options: { value: string; label: string }[]; selectedValues: string[]; onChange: (values: string[]) => void; columns?: 1 | 2;
}) {
    const gridClassName = columns === 2 ? "grid-cols-2" : "grid-cols-1";
    const handleToggle = (value: string) => {
        onChange(selectedValues.includes(value) ? selectedValues.filter((v) => v !== value) : [...selectedValues, value]);
    };
    return (
        <div className="space-y-1.5">
            <label className="text-tiny font-bold text-foreground-tertiary uppercase tracking-wider">{label}</label>
            <div className={`grid ${gridClassName} gap-2 p-3 bg-muted/20 border border-border rounded-lg`}>
                {options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-primary rounded border-input focus-visible:ring-2 focus-visible:ring-primary/40"
                            checked={selectedValues.includes(opt.value)} onChange={() => handleToggle(opt.value)} />
                        <span className="text-body font-medium text-foreground-secondary group-hover:text-primary transition-colors">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
