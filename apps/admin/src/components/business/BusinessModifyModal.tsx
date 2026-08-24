"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Loader2,
  Pencil,
} from "@esparex/ui";
import { mapErrorToMessage } from "@/lib/mapErrorToMessage";
import type { Business } from "@esparex/contracts";
import {
  BusinessModifyLocationSection,
  type BusinessModifyFormState,
} from "./BusinessModifyLocationSection";

interface BusinessModifyModalProps {
  business: Business;
  onClose: () => void;
  onConfirm: (patch: Partial<Business>) => Promise<void>;
}

export function BusinessModifyModal({ business, onClose, onConfirm }: BusinessModifyModalProps) {
  const [form, setForm] = useState<BusinessModifyFormState>({
    name: business.name ?? "",
    description: business.description ?? "",
    mobile: business.mobile ?? "",
    email: business.email ?? "",
    website: business.website ?? "",
    gstNumber: business.gstNumber ?? "",
    registrationNumber: business.registrationNumber ?? "",
    shopNo: business.location?.shopNo ?? "",
    street: business.location?.street ?? "",
    landmark: business.location?.landmark ?? "",
    address: business.location?.address ?? "",
    city: business.location?.city ?? "",
    state: business.location?.state ?? "",
    pincode: business.location?.pincode ?? "",
    locationId: business.location?.locationId ?? business.locationId ?? "",
    coordinates: business.location?.coordinates ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  type FormTextKey = Exclude<keyof BusinessModifyFormState, "coordinates">;

  const renderField = (key: FormTextKey, label: string, opts?: { type?: string; rows?: number }) => (
    <div>
      <label className="block text-tiny font-bold text-foreground-tertiary uppercase tracking-wider mb-1">
        {label}
      </label>
      {opts?.rows ? (
        <textarea
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
          rows={opts.rows}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          disabled={loading}
        />
      ) : (
        <input
          type={opts?.type ?? "text"}
          className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
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
          ...(form.locationId.trim() ? { locationId: form.locationId.trim() } : {}),
          shopNo: form.shopNo.trim(),
          street: form.street.trim(),
          landmark: form.landmark.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          ...(form.coordinates ? { coordinates: form.coordinates } : {}),
        },
      };
      await onConfirm(patch as Partial<Business>);
      onClose();
    } catch (err) {
      setError(mapErrorToMessage(err, "Failed to update business"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl p-0 flex flex-col">
        <DialogHeader className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Pencil size={18} />
            </div>
            <div>
              <DialogTitle className="text-body-lg font-bold text-foreground">Modify Business</DialogTitle>
              <DialogDescription className="text-caption text-foreground-tertiary mt-0.5">
                Editing <span className="font-semibold text-foreground-secondary">{business.name}</span> — status will remain unchanged.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Core Info */}
          <section className="space-y-3">
            <p className="text-tiny font-bold text-foreground-subtle uppercase tracking-widest">Business Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField("name", "Business Name *")}
              {renderField("mobile", "Mobile Number")}
              {renderField("email", "Email Address", { type: "email" })}
              {renderField("website", "Website")}
              {renderField("gstNumber", "GST Number")}
              {renderField("registrationNumber", "Registration Number")}
            </div>
            {renderField("description", "Description", { rows: 3 })}
          </section>

          {/* Location Section */}
          <BusinessModifyLocationSection
            form={form}
            setForm={setForm}
            loading={loading}
            setError={setError}
            renderField={renderField}
            initialDisplay={business.location?.display}
          />

          {error && (
            <p className="text-caption text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-border text-foreground-secondary font-semibold hover:bg-card transition-all text-body cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-body flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
