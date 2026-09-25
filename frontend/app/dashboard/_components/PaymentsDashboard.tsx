"use client";

import React, { useState, useEffect } from "react";
import { servicesApi, PaymentRecord } from "@/lib/services-api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RupeeIcon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Clock01Icon,
  Copy01Icon,
  Calendar01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export function PaymentsDashboard() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [page]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await servicesApi.listPayments(page, 10);
      setPayments(res.payments || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[11px] py-0.5">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3" />
            SUCCESS
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] py-0.5">
            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3" />
            FAILED
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[11px] py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" />
            PENDING
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xs border-border/70 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HugeiconsIcon icon={RupeeIcon} strokeWidth={2} className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold tracking-tight">Payments Ledger</CardTitle>
                  <Badge variant="outline" className="text-[11px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    Port 3004
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {totalCount} total
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Complete ledger of all processed transactions and payment records
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              disabled={loading}
              className="h-8 text-xs cursor-pointer gap-1.5 self-start sm:self-auto"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                className={`size-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs font-semibold">Transaction Reference</TableHead>
                  <TableHead className="text-xs font-semibold">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold">User ID</TableHead>
                  <TableHead className="text-xs font-semibold">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-5 animate-spin text-amber-500" />
                        <span>Loading payments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No payments found in the database.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="py-3 font-medium">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {p.transactionReference || p.id.slice(0, 16)}
                          </span>
                          {p.transactionReference && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.transactionReference!, "Transaction Reference")}
                              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded hover:bg-muted"
                              title="Copy Reference"
                            >
                              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                            </button>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="text-primary font-medium">{p.orderId}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.orderId, "Order ID")}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded hover:bg-muted"
                            title="Copy Order ID"
                          >
                            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                          <span className="font-mono">{p.userId}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-mono font-bold text-xs text-foreground">
                          ${p.amount.toFixed(2)}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        {getStatusBadge(p.status)}
                      </TableCell>

                      <TableCell className="py-3 text-right text-xs text-muted-foreground font-mono">
                        <div className="flex items-center justify-end gap-1">
                          <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                          <span>{new Date(p.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Shadcn Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span> • Total {totalCount} records
              </p>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={page === p}
                        onClick={() => setPage(p)}
                        disabled={loading}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || loading}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
