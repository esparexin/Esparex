import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "@/icons/IconRegistry";

interface FileUploadCardProps {
    title: string;
    description: string;
    file: File | string | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
}

export function FileUploadCard({
    title,
    description,
    file,
    onUpload,
    onRemove
}: FileUploadCardProps) {
    return (
        <div className="border-2 border-slate-100 rounded-2xl p-5 hover:border-blue-100 transition-colors">
            <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 mb-5">{description}</p>

            {file ? (
                <div className="flex items-center justify-between bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <FileText className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-900">
                                {file instanceof File ? file.name : "Existing Document (Uploaded)"}
                            </p>
                            <p className="text-xs text-emerald-600/70 font-medium">
                                {file instanceof File ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "Verified"}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-full"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            ) : (
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all group">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 mb-1">Upload Document</span>
                    <span className="text-xs text-slate-400 font-medium">PDF, JPG, PNG (Max 5MB)</span>
                    <input
                        id={`reg-${title.toLowerCase().replace(/\s+/g, "-")}`}
                        name={`reg-${title.toLowerCase().replace(/\s+/g, "-")}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) onUpload(selectedFile);
                        }}
                    />
                </label>
            )}
        </div>
    );
}
