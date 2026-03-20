import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, Package, Wrench, CheckCircle2 } from "@/icons/IconRegistry";
import { StepBaseProps } from "./types";
import { CompletedStepCard } from "./CompletedStepCard";

interface StepBusinessTypeProps extends StepBaseProps { }

export function StepBusinessType({
    formData,
    setFormData,
    onNext,
    isActive,
    isCompleted,
    onEdit
}: StepBusinessTypeProps) {

    const toggleArrayItem = (arr: string[], item: string) => {
        if (arr.includes(item)) {
            return arr.filter(i => i !== item);
        }
        return [...arr, item];
    };

    const getBusinessTypeName = (value: string) => {
        const map: Record<string, string> = {
            "repair": "Repair Services",
            "spare-parts": "Spare Parts Seller"
        };
        return map[value] || value;
    };

    if (isCompleted && !isActive) {
        return (
            <CompletedStepCard
                title="Business Type"
                summary={formData.businessTypes.map(getBusinessTypeName).join(", ")}
                onEdit={onEdit}
            />
        );
    }

    if (!isActive) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#0652DD]" />
                    Select Business Type
                </CardTitle>
                <CardDescription>
                    Choose what type of business you operate (you can select both)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Repair Services Chip */}
                    <button
                        onClick={() => setFormData({
                            ...formData,
                            businessTypes: toggleArrayItem(formData.businessTypes, "repair")
                        })}
                        className={`p-5 rounded-xl border-2 transition-all text-left min-h-[80px] ${formData.businessTypes.includes("repair")
                            ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-50"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${formData.businessTypes.includes("repair")
                                ? "bg-blue-600 shadow-lg shadow-blue-200"
                                : "bg-slate-100"
                                }`}>
                                <Wrench className={`h-7 w-7 ${formData.businessTypes.includes("repair") ? "text-white" : "text-slate-500"
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-lg ${formData.businessTypes.includes("repair") ? "text-blue-900" : "text-slate-900"}`}>Repair Services</h3>
                                <p className="text-sm text-slate-500">Technician / Service Center</p>
                            </div>
                            {formData.businessTypes.includes("repair") && (
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            )}
                        </div>
                    </button>

                    {/* Spare Parts Seller Chip */}
                    <button
                        onClick={() => setFormData({
                            ...formData,
                            businessTypes: toggleArrayItem(formData.businessTypes, "spare-parts")
                        })}
                        className={`p-5 rounded-xl border-2 transition-all text-left min-h-[80px] ${formData.businessTypes.includes("spare-parts")
                            ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-50"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${formData.businessTypes.includes("spare-parts")
                                ? "bg-blue-600 shadow-lg shadow-blue-200"
                                : "bg-slate-100"
                                }`}>
                                <Package className={`h-7 w-7 ${formData.businessTypes.includes("spare-parts") ? "text-white" : "text-slate-500"
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold text-lg ${formData.businessTypes.includes("spare-parts") ? "text-blue-900" : "text-slate-900"}`}>Spare Parts Seller</h3>
                                <p className="text-sm text-slate-500">Reseller / Distributor</p>
                            </div>
                            {formData.businessTypes.includes("spare-parts") && (
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            )}
                        </div>
                    </button>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-end md:static md:bg-transparent md:border-0 md:p-0 md:mt-8">
                    <Button
                        onClick={onNext}
                        disabled={formData.businessTypes.length === 0}
                        className="w-full md:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
                    >
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
