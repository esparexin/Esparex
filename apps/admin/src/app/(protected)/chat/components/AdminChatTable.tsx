"use client";

import { Button } from "@esparex/ui";
import { formatShortRelativeTime } from "@esparex/shared";
import type { AdminConvSummary } from "@/lib/api/adminChat";

export interface AdminChatTableProps {
  items: AdminConvSummary[];
  isLoading: boolean;
  onLocate: (chatId: string) => void;
  onMute: (chat: AdminConvSummary) => void;
  onExport: (chatId: string) => void;
}

export function AdminChatTable({
  items,
  isLoading,
  onLocate,
  onMute,
  onExport,
}: AdminChatTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-body">
        <thead className="border-b border-border bg-muted/20 text-caption font-semibold text-foreground-tertiary">
          <tr>
            <th className="px-4 py-3 text-left">Buyer</th>
            <th className="px-4 py-3 text-left">Seller</th>
            <th className="px-4 py-3 text-left">Ad</th>
            <th className="px-4 py-3 text-left">Last Message</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Updated</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {isLoading ? (
            [...Array(5)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(7)].map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-foreground-subtle">
                No chats found for this filter.
              </td>
            </tr>
          ) : (
            items.map((conv) => (
              <tr key={conv.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{conv.buyerName}</td>
                <td className="px-4 py-3 text-foreground-secondary">{conv.sellerName}</td>
                <td className="max-w-[160px] truncate px-4 py-3 text-foreground-secondary" title={conv.adTitle}>
                  {conv.adTitle}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-foreground-tertiary" title={conv.lastMessage}>
                  {conv.lastMessage ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {conv.isBlocked ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-tiny font-semibold text-destructive">
                      Blocked
                    </span>
                  ) : conv.isAdClosed ? (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-tiny font-semibold text-warning">
                      Closed
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-tiny font-semibold text-primary">
                      Active
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-foreground-subtle">
                  {conv.updatedAt ? formatShortRelativeTime(conv.updatedAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onLocate(conv.id)}
                      className="h-7 px-2 text-primary hover:text-primary-hover text-caption font-medium cursor-pointer"
                    >
                      Locate
                    </Button>
                    {!conv.isBlocked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onMute(conv)}
                        className="h-7 px-2 text-warning hover:text-warning/90 text-caption font-medium cursor-pointer"
                      >
                        Mute
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onExport(conv.id)}
                      className="h-7 px-2 text-foreground-secondary hover:text-foreground text-caption font-medium cursor-pointer"
                    >
                      Export
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
