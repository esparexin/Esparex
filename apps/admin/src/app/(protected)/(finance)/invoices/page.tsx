"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Download, FileText } from "@esparex/ui";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { adminFetch, getAdminApiBase } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { AlertCircle } from "@esparex/ui";
import {
  buildUrlWithSearchParams,
  normalizeSearchParamValue,
  parsePositiveIntParam,
  updateSearchParams,
} from "@/lib/urlSearchParams";

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

const ADMIN_API_BASE = getAdminApiBase();

const INVOICE_STATUSES = new Set(["all", "PENDING", "SUCCESS", "FAILED", "CANCELLED"]);

export default function InvoicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    limit: 20,
  });

  const rawSearch = searchParams.get("q") ?? searchParams.get("search");
  const rawStatus = searchParams.get("status");
  const rawPage = searchParams.get("page");
  const search = normalizeSearchParamValue(rawSearch);
  const status = rawStatus && INVOICE_STATUSES.has(rawStatus) ? rawStatus : "all";
  const page = parsePositiveIntParam(rawPage, 1);

  const replaceQueryState = useCallback((updates: Record<string, string | number | null | undefined>) => {
    const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, { search: null, ...updates }));
    const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const query = new URLSearchParams({
            page: String(page),
            limit: "20",
          });
          if (search) {
            query.set("q", search);
          }
          if (status !== "all") {
            query.set("status", status);
          }

          const response = await adminFetch<unknown>(`${ADMIN_ROUTES.INVOICES}?${query.toString()}`);
          const parsed = parseAdminResponse<AdminInvoice>(response);
          setItems(parsed.items);
          setPagination({
            total: parsed.pagination?.total ?? parsed.items.length,
            pages: parsed.pagination?.pages ?? parsed.pagination?.totalPages ?? 1,
            limit: parsed.pagination?.limit ?? 20,
          });
          setError("");
        } catch (err) {
          setError(mapErrorToMessage(err, "Failed to load invoices"));
        } finally {
          setLoading(false);
        }
      })();
    }, 250);

    return () => clearTimeout(timer);
  }, [page, search, status]);

  useEffect(() => {
    const nextUrl = buildUrlWithSearchParams(
      pathname,
        updateSearchParams(searchParams, {
        search: null,
        q: search,
        status: status === "all" ? null : status,
        page: page > 1 ? page : null,
      })
    );
    const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [page, pathname, router, search, searchParams, status]);

  useEffect(() => {
    if (!loading && page > pagination.pages) {
      replaceQueryState({ page: pagination.pages > 1 ? pagination.pages : null });
    }
  }, [loading, page, pagination.pages, replaceQueryState]);

  const columns: ColumnDef<AdminInvoice>[] = [
    {
      header: "Invoice",
      cell: (invoice) => (
        <div>
          <div className="font-semibold text-foreground">{invoice.invoiceNumber}</div>
          <div className="text-xs text-foreground-tertiary">
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
          <div className="text-xs text-foreground-tertiary">{invoice.userId?.email || invoice.userId?.mobile || "-"}</div>
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
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground-secondary hover:text-foreground-secondary"
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
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input
              value={search}
              onChange={(e) => replaceQueryState({ q: e.target.value, page: null })}
              placeholder="Search invoice number or customer..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-black outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => replaceQueryState({ status: e.target.value === "all" ? null : e.target.value, page: null })}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-4 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="min-h-0 flex-1">
          <DataTable
            data={items}
            columns={columns}
            isLoading={loading}
            emptyMessage="No invoices found"
            pagination={{
              currentPage: page,
              totalPages: pagination.pages,
              totalItems: pagination.total,
              pageSize: pagination.limit,
              onPageChange: (nextPage: number) => replaceQueryState({ page: nextPage > 1 ? nextPage : null }),
            }}
            enableCsvExport
            csvFileName="invoices.csv"
            enableColumnVisibility
          />
        </div>
      </div>
    </AdminPageShell>
  );
}
