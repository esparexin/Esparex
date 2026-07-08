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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <div className={`grid ${gridClassName} gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg`}>
                {options.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary/20"
                            checked={selectedValues.includes(opt.value)} onChange={() => handleToggle(opt.value)} />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
