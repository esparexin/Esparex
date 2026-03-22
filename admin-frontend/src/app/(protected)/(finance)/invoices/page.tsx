"use client";

import { useEffect, useState } from "react";
import { Search, Download, FileText, AlertCircle } from "lucide-react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import {
  ADMIN_ROUTES,
  ADMIN_API_V1_BASE_PATH,
  DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";

type AdminInvoice = {
  id: string;
  invoiceNumber: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  amount: number;
  total?: number;
  currency: string;
  pdfUrl?: string;
  issuedAt: string;
  userId?: {
    name?: string;
    email?: string;
    mobile?: string;
  };
};

const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  `${DEFAULT_LOCAL_API_ORIGIN}${ADMIN_API_V1_BASE_PATH}`;

export default function InvoicesPage() {
  const [items, setItems] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const query = new URLSearchParams({
            page: "1",
            limit: "20",
            search,
            status,
          }).toString();
          const response = await adminFetch(`${ADMIN_ROUTES.INVOICES}?${query}`);
          const parsed = parseAdminResponse<AdminInvoice>(response);
          setItems(parsed.items);
          setError("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load invoices");
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  const columns: ColumnDef<AdminInvoice>[] = [
    {
      header: "Invoice",
      cell: (invoice) => (
        <div>
          <div className="font-semibold text-slate-900">{invoice.invoiceNumber}</div>
          <div className="text-xs text-slate-500">
            {new Date(invoice.issuedAt).toLocaleDateString("en-IN")}
          </div>
        </div>
      )
    },
    {
      header: "Customer",
      cell: (invoice) => (
        <div>
          <div className="font-medium">{invoice.userId?.name || "Customer"}</div>
          <div className="text-xs text-slate-500">{invoice.userId?.email || invoice.userId?.mobile || "-"}</div>
        </div>
      )
    },
    {
      header: "Amount",
      cell: (invoice) => (
        <span className="font-semibold">
          {invoice.currency} {(invoice.total ?? invoice.amount).toFixed(2)}
        </span>
      )
    },
    {
      header: "Status",
      cell: (invoice) => (
        <span className={`rounded px-2 py-1 text-xs font-semibold ${
          invoice.status === "SUCCESS"
            ? "bg-emerald-100 text-emerald-700"
            : invoice.status === "PENDING"
              ? "bg-amber-100 text-amber-700"
              : "bg-red-100 text-red-700"
        }`}>
          {invoice.status}
        </span>
      )
    },
    {
      header: "Actions",
      cell: (invoice) => (
        <div className="flex items-center gap-2">
          {invoice.pdfUrl ? (
            <a
              href={invoice.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Download size={14} />
              PDF
            </a>
          ) : (
            <a
              href={`${ADMIN_API_BASE}${ADMIN_ROUTES.INVOICE_PRINT(invoice.id)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-700"
            >
              <FileText size={14} />
              View
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <AdminPageShell
      title="Invoices"
      description="Review generated invoices, GST billing records, and downloadable PDFs."
      tabs={<AdminModuleTabs tabs={financeTabs} />}
      filters={
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number or customer..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-black outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      }
    >
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      ) : null}
      <DataTable data={items} columns={columns} isLoading={loading} emptyMessage="No invoices found" />
    </AdminPageShell>
  );
}
