import React from "react";
import type { CatalogRequestItem } from "@/lib/api/catalogRequests";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Checkbox,
  type ColumnDef,
} from "@esparex/ui";
import {
  CatalogActionsRow,
  CatalogActionIconButton,
  CatalogEntityCell,
} from "@/components/catalog/primitives";

interface GenerateCatalogRequestsColumnsParams {
  headerCheckedState: boolean | "indeterminate";
  onToggleSelectAll: (checked: boolean) => void;
  selectedIds: string[];
  onToggleSelect: (id: string, checked: boolean) => void;
  handleApprove: (id: string) => Promise<void>;
  onOpenRejectModal: (req: CatalogRequestItem) => void;
}

export function generateCatalogRequestsColumns({
  headerCheckedState,
  onToggleSelectAll,
  selectedIds,
  onToggleSelect,
  handleApprove,
  onOpenRejectModal,
}: GenerateCatalogRequestsColumnsParams): ColumnDef<CatalogRequestItem>[] {
  return [
    {
      header: (
        <Checkbox
          checked={headerCheckedState}
          onCheckedChange={(checked) => onToggleSelectAll(checked === true)}
          aria-label="Select all catalog requests"
        />
      ),
      id: "select",
      className: "w-12",
      cell: (req) => (
        <Checkbox
          checked={selectedIds.includes(req.id)}
          onCheckedChange={(checked) => onToggleSelect(req.id, checked === true)}
          aria-label={`Select request for ${req.requestedName}`}
        />
      ),
    },
    {
      header: "Request",
      cell: (req) => {
        const userName =
          typeof req.requestedBy === "string"
            ? req.requestedBy
            : `${req.requestedBy.firstName} ${req.requestedBy.lastName}`;
        return (
          <div className="flex flex-col gap-1">
            <CatalogEntityCell
              icon={<ClipboardList size={20} />}
              iconClassName="bg-amber-50 text-amber-600"
              title={req.requestedName}
              subtitle={`${req.requestType} • ${userName}`}
            />
            {req.listingId && (
              <a
                href={`/listing/${req.listingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 ml-10 text-tiny font-semibold text-primary hover:underline"
              >
                <ExternalLink size={10} />
                View Listing
              </a>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (req) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-tiny font-bold uppercase tracking-wider ${
            req.status === "approved" || req.status === "resolved"
              ? "bg-emerald-100 text-emerald-700"
              : req.status === "rejected"
              ? "bg-destructive/10 text-destructive"
              : req.status === "duplicate"
              ? "bg-primary/10 text-primary"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {req.status === "pending" ? (
            <Clock size={10} />
          ) : req.status === "approved" || req.status === "resolved" ? (
            <CheckCircle size={10} />
          ) : (
            <AlertCircle size={10} />
          )}
          {req.status}
        </span>
      ),
    },
    {
      header: "Demand",
      cell: (req) => {
        const count = req.requestCount ?? 1;
        const isHot = count >= 5;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-tiny font-bold ${
              isHot
                ? "bg-rose-100 text-rose-700"
                : count >= 2
                ? "bg-amber-100 text-amber-700"
                : "bg-muted text-foreground-tertiary"
            }`}
          >
            ×{count}
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (req) => (
        <CatalogActionsRow>
          {req.status === "pending" && (
            <>
              <CatalogActionIconButton
                onClick={() => void handleApprove(req.id)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                title="Approve"
                icon={<CheckCircle size={18} />}
              />
              <CatalogActionIconButton
                onClick={() => onOpenRejectModal(req)}
                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                title="Reject"
                icon={<XCircle size={18} />}
              />
            </>
          )}
        </CatalogActionsRow>
      ),
    },
  ];
}
