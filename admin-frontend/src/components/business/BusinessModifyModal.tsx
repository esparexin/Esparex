"use client";

import { useState } from "react";
import { Pencil, MapPin } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Business } from "@/types/business";

interface BusinessModifyModalProps {
    business: Business;
    onClose: () => void;
    onConfirm: (patch: Partial<Business>) => Promise<void>;
}

export function BusinessModifyModal({ business, onClose, onConfirm }: BusinessModifyModalProps) {
    const [form, setForm] = useState({
        name: business.name ?? "",
        description: business.description ?? "",
        mobile: business.mobile ?? "",
        email: business.email ?? "",
        website: business.website ?? "",
        gstNumber: business.gstNumber ?? "",
        registrationNumber: business.registrationNumber ?? "",
        address: business.location?.address ?? "",
        city: business.location?.city ?? "",
        state: business.location?.state ?? "",
        pincode: business.location?.pincode ?? "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const field = (key: keyof typeof form, label: string, opts?: { type?: string; rows?: number }) => (
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
            {opts?.rows ? (
                <textarea
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                    rows={opts.rows}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    disabled={loading}
                />
            ) : (
                <input
                    type={opts?.type ?? "text"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    disabled={loading}
                />
            )}
        </div>
    );

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setError("Business name is required.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const patch: Record<string, unknown> = {
                name: form.name.trim(),
                description: form.description.trim(),
                mobile: form.mobile.trim(),
                email: form.email.trim(),
                website: form.website.trim(),
                gstNumber: form.gstNumber.trim(),
                registrationNumber: form.registrationNumber.trim(),
                location: {
                    address: form.address.trim(),
                    city: form.city.trim(),
                    state: form.state.trim(),
                    pincode: form.pincode.trim(),
                },
            };
            await onConfirm(patch as Partial<Business>);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update business");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl p-0 flex flex-col">
                <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Pencil size={18} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-900">Modify Business</DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 mt-0.5">
                                Editing <span className="font-semibold text-slate-700">{business.name}</span> — status will remain unchanged.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                    {/* Core Info */}
                    <section className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Info</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field("name", "Business Name *")}
                            {field("mobile", "Mobile Number")}
                            {field("email", "Email Address", { type: "email" })}
                            {field("website", "Website")}
                            {field("gstNumber", "GST Number")}
                            {field("registrationNumber", "Registration Number")}
                        </div>
                        {field("description", "Description", { rows: 3 })}
                    </section>

                    {/* Location */}
                    <section className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin size={12} /> Location
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {field("address", "Street Address")}
                            {field("city", "City")}
                            {field("state", "State")}
                            {field("pincode", "Pincode")}
                        </div>
                    </section>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-all text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <Pencil size={16} />
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
