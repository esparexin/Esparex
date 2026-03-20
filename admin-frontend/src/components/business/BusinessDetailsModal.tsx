"use client";

import { Business } from "@/types/business";
import {
    X,
    Building2,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    FileText,
    CheckCircle2,
    XCircle,
    Globe,
    FileCheck,
    Trash2,
    Ban,
    RotateCcw,
    Pencil
} from "lucide-react";
import { format } from "date-fns";
import { buildBusinessFallbackLocationDisplay, resolveLocationDisplay } from "@/lib/location/display";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface BusinessDetailsModalProps {
    business: Business;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete?: (id: string) => void;
    onModify?: (business: Business) => void;
    onSuspend?: (id: string) => void;
    onActivate?: (id: string) => void;
}

export function BusinessDetailsModal({ business, onClose, onApprove, onReject, onDelete, onModify, onSuspend, onActivate }: BusinessDetailsModalProps) {
    if (!business) return null;

    const groupedDocs = {
        id_proof: business.documents?.filter(d => d.type === 'id_proof') || [],
        business_proof: business.documents?.filter(d => d.type === 'business_proof') || [],
        certificate: business.documents?.filter(d => d.type === 'certificate') || []
    };

    const trustScore = business.trustScore ?? 0;
    const scoreColor = trustScore > 70 ? 'text-emerald-600' : trustScore > 40 ? 'text-amber-600' : 'text-red-600';
    const scoreBg = trustScore > 70 ? 'bg-emerald-100' : trustScore > 40 ? 'bg-amber-100' : 'bg-red-100';

    const locationDisplay = resolveLocationDisplay({
        locationLabel: (business as any).locationLabel,
        coordinates: business.location?.coordinates,
        fallbackDisplay: buildBusinessFallbackLocationDisplay(business.location),
        emptyText: "Location not available",
    });

    return (
        <Dialog open={Boolean(business)} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl p-0 flex flex-col" hideClose>
                {/* Header */}
                <DialogHeader className="p-6 border-b border-slate-100 flex-row items-center justify-between bg-slate-50/50 space-y-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl flex items-center gap-3">
                                {business.name}
                                {trustScore < 30 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase border border-red-200">
                                        Low Trust
                                    </span>
                                )}
                            </DialogTitle>
                            <DialogDescription className="sr-only">Review business profile and verification documents</DialogDescription>
                            <p className="text-slate-500 text-sm flex items-center gap-1">
                                <span className="capitalize">{business.status === 'live' ? 'Approved' : business.status}</span> Request • Submitted on {format(new Date(business.createdAt), "PPP")}
                            </p>
                            <p className="text-slate-400 text-[11px] flex items-center gap-2 mt-1">
                                <span>Modified: {format(new Date(business.updatedAt || business.createdAt), "PPP p")}</span>
                                {business.isDeleted && (
                                    <span className="flex items-center gap-1 text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                        <XCircle size={10} /> DELETED
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* Trust Score Mini-Widget */}
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trust Score</div>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${trustScore > 70 ? 'bg-emerald-500' : trustScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${trustScore}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-bold ${scoreColor}`}>{trustScore}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Details</div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Mail size={14} className="text-primary" /> {business.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Phone size={14} className="text-primary" /> {business.mobile}
                                </div>
                                {business.website && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Globe size={14} className="text-primary" /> {business.website}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Identifiers</div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-slate-700 flex justify-between">
                                    <span>GST:</span>
                                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                                        {business.gstNumber || 'N/A'}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-slate-700 flex justify-between">
                                    <span>Reg No:</span>
                                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                                        {business.registrationNumber || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</div>
                            <div className="text-sm text-slate-700 flex gap-2">
                                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                                <span>{locationDisplay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={18} className="text-primary" /> Description
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {business.description || "No description provided."}
                        </p>
                    </div>

                    {/* Verification Documents */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileCheck size={18} className="text-primary" /> Verification Documents (Versioned)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* ID Proof */}
                            <div className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-[4/3] flex flex-col">
                                <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase">ID Proof</span>
                                    {groupedDocs.id_proof.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">v{groupedDocs.id_proof[0]?.version}</span>
                                    )}
                                </div>
                                <div className="flex-1 flex items-center justify-center p-4">
                                    {groupedDocs.id_proof.length > 0 ? (
                                        <a href={groupedDocs.id_proof[0]?.url} target="_blank" className="relative block w-full h-full">
                                            <img src={groupedDocs.id_proof[0]?.url} className="w-full h-full object-cover rounded-md" alt="ID Proof" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                                                <ExternalLink size={16} /> VIEW FULL
                                            </div>
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">No ID Proof uploaded</span>
                                    )}
                                </div>
                            </div>

                            {/* Business Proof */}
                            <div className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-[4/3] flex flex-col">
                                <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase">Business Proof</span>
                                    {groupedDocs.business_proof.length > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">v{groupedDocs.business_proof[0]?.version}</span>
                                    )}
                                </div>
                                <div className="flex-1 flex items-center justify-center p-4">
                                    {groupedDocs.business_proof.length > 0 ? (
                                        <a href={groupedDocs.business_proof[0]?.url} target="_blank" className="relative block w-full h-full">
                                            <img src={groupedDocs.business_proof[0]?.url} className="w-full h-full object-cover rounded-md" alt="Business Proof" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                                                <ExternalLink size={16} /> VIEW FULL
                                            </div>
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">No Business Proof uploaded</span>
                                    )}
                                </div>
                            </div>

                            {/* Certificates */}
                            <div className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-[4/3] flex flex-col">
                                <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase">Certificates</span>
                                </div>
                                <div className="flex-1 overflow-hidden p-4">
                                    <div className="grid grid-cols-2 gap-2 h-full">
                                        {groupedDocs.certificate.length > 0 ? (
                                            groupedDocs.certificate.slice(0, 4).map((doc, i) => (
                                                <a key={i} href={doc.url} target="_blank" className="relative block h-full">
                                                    <img src={doc.url} className="w-full h-full object-cover rounded shadow-sm border border-slate-200" alt={`Certificate ${i + 1}`} />
                                                </a>
                                            ))
                                        ) : (
                                            <div className="col-span-2 flex items-center justify-center text-slate-400 text-xs italic h-full">
                                                No certificates uploaded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shop Images */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Building2 size={18} className="text-primary" /> Shop Images
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {(business.images || []).map((url, i) => (
                                <a key={i} href={url} target="_blank" className="shrink-0 w-48 h-32 rounded-xl overflow-hidden border border-slate-200 hover:border-primary transition-colors">
                                    <img src={url} className="w-full h-full object-cover" alt={`Shop ${i + 1}`} />
                                </a>
                            ))}
                            {(!business.images || business.images.length === 0) && <span className="text-slate-400 text-sm italic py-4">No images provided</span>}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {onModify && (
                            <button
                                onClick={() => onModify(business)}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200 hover:bg-slate-200 transition-all text-sm flex items-center gap-2"
                            >
                                <Pencil size={15} /> Modify
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(business.id)}
                                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-100 hover:bg-red-100 transition-all text-sm flex items-center gap-2"
                            >
                                <Trash2 size={15} /> Delete
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-all text-sm"
                        >
                            Close
                        </button>
                        {business.status === "live" && onSuspend && (
                            <button
                                onClick={() => onSuspend(business.id)}
                                className="px-5 py-2 rounded-xl bg-orange-50 text-orange-600 font-semibold border border-orange-100 hover:bg-orange-100 transition-all text-sm flex items-center gap-2"
                            >
                                <Ban size={15} /> Suspend
                            </button>
                        )}
                        {business.status === "suspended" && onActivate && (
                            <button
                                onClick={() => onActivate(business.id)}
                                className="px-5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 hover:bg-emerald-100 transition-all text-sm flex items-center gap-2"
                            >
                                <RotateCcw size={15} /> Reactivate
                            </button>
                        )}
                        {business.status === "pending" && (
                            <>
                                <button
                                    onClick={() => onReject(business.id)}
                                    className="px-6 py-2 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-100 hover:bg-red-100 transition-all text-sm flex items-center gap-2"
                                >
                                    <XCircle size={18} /> Reject Application
                                </button>
                                <button
                                    onClick={() => onApprove(business.id)}
                                    className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all text-sm flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Approve Business
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
