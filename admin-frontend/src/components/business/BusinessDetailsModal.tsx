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
                <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Building2 size={22} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">{business.name}</DialogTitle>
                                {trustScore < 30 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase border border-red-200 shrink-0">Low Trust</span>
                                )}
                                {/* Trust Score inline on mobile */}
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg} ${scoreColor} shrink-0`}>
                                    Trust: {trustScore}
                                </span>
                            </div>
                            <DialogDescription className="sr-only">Review business profile and verification documents</DialogDescription>
                            <p className="text-slate-500 text-xs mt-0.5">
                                <span className="capitalize font-medium">{business.status === 'live' ? 'Approved' : business.status}</span>
                                {' • '}Submitted {format(new Date(business.createdAt), "PP")}
                                {business.isDeleted && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100 text-[10px]">
                                        <XCircle size={9} /> DELETED
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {/* X button — clear top-right placement */}
                    <button
                        onClick={onClose}
                        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700 shrink-0 mt-0.5"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar space-y-6">
                    {/* Basic Info Grid — single row, each card full-width on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact</div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                    <Mail size={13} className="text-primary shrink-0" />
                                    <span className="truncate text-xs">{business.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Phone size={13} className="text-primary shrink-0" />
                                    <span className="text-xs">{business.mobile}</span>
                                </div>
                                {business.website && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                        <Globe size={13} className="text-primary shrink-0" />
                                        <span className="truncate text-xs">{business.website}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Identifiers</div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-slate-600">GST</span>
                                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[100px]">
                                        {business.gstNumber || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-slate-600">Reg No</span>
                                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[100px]">
                                        {business.registrationNumber || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</div>
                            <div className="flex gap-2">
                                <MapPin size={13} className="text-primary shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 leading-snug">
                                    {(business as any).locationLabel ||
                                     (business.location as any)?.city ||
                                     (business.location as any)?.display ||
                                     (locationDisplay && !locationDisplay.includes('Lat') && !locationDisplay.includes('Lng') ? locationDisplay : 'Coordinates on file')}
                                </span>
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
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {onModify && (
                            <button
                                onClick={() => onModify(business)}
                                className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200 hover:bg-slate-200 transition-colors text-sm"
                            >
                                <Pencil size={15} /> Modify
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(business.id)}
                                className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-100 hover:bg-red-100 transition-colors text-sm"
                            >
                                <Trash2 size={15} /> Delete
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={onClose}
                            className="inline-flex h-10 items-center px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition-colors text-sm"
                        >
                            Close
                        </button>
                        {business.status === "live" && onSuspend && (
                            <button
                                onClick={() => onSuspend(business.id)}
                                className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-orange-50 text-orange-600 font-semibold border border-orange-100 hover:bg-orange-100 transition-colors text-sm"
                            >
                                <Ban size={15} /> Suspend
                            </button>
                        )}
                        {business.status === "suspended" && onActivate && (
                            <button
                                onClick={() => onActivate(business.id)}
                                className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors text-sm"
                            >
                                <RotateCcw size={15} /> Reactivate
                            </button>
                        )}
                        {business.status === "pending" && (
                            <>
                                <button
                                    onClick={() => onReject(business.id)}
                                    className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-red-50 text-red-600 font-semibold border border-red-100 hover:bg-red-100 transition-colors text-sm"
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                                <button
                                    onClick={() => onApprove(business.id)}
                                    className="inline-flex h-10 items-center gap-2 px-4 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-colors text-sm"
                                >
                                    <CheckCircle2 size={16} /> Approve
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
