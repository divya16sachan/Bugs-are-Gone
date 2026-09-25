"use client";

import React, { useState, useEffect } from "react";
import { servicesApi, Order, PaymentRecord } from "@/lib/services-api";
import { getAccessToken } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag01Icon,
  RefreshIcon,
  Search01Icon,
  RupeeIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Clock01Icon,
  Calendar01Icon,
  DeliveryTruck01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

export function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Order Details Inspector Sheet State
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentRecord | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [orderSearchId, setOrderSearchId] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Quick Payment Trigger
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setHasToken(!!token);
    if (token) {
      loadOrders();
    }
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await servicesApi.listOrders(page, 10);
      setOrders(res.orders || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      if (err.status === 401) {
        toast.info("Please login or create a user in the Users tab to view authenticated orders");
      } else {
        toast.error(err.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInspector = async (order: Order) => {
    setSelectedOrder(order);
    setInspectorOpen(true);
    setLoadingPayment(true);
    try {
      const payment = await servicesApi.getPaymentByOrderId(order.id);
      setPaymentDetails(payment);
    } catch {
      setPaymentDetails(null);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSearchOrderById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSearchId.trim()) return;
    setSearchLoading(true);
    try {
      const order = await servicesApi.getOrderById(orderSearchId.trim());
      await handleOpenInspector(order);
      toast.success("Order found");
    } catch (err: any) {
      toast.error(err.message || "Order not found");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleProcessPaymentForOrder = async (order: Order) => {
    setPayingOrderId(order.id);
    try {
      const payment = await servicesApi.processPayment({
        orderId: order.id,
        userId: order.userId,
        amount: order.totalAmount,
      });
      toast.success(`Payment processed (${payment.status})! Tx: ${payment.transactionReference || "OK"}`);
      setPaymentDetails(payment);

      // Refresh orders list
      await loadOrders();

      // Update selected order status
      const updated = await servicesApi.getOrderById(order.id);
      setSelectedOrder(updated);
    } catch (err: any) {
      toast.error(err.message || "Payment processing failed");
    } finally {
      setPayingOrderId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[11px] py-0.5">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3" />
            COMPLETED
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1 text-[11px] py-0.5">
            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3" />
            FAILED
          </Badge>
        );
      case "PENDING_PAYMENT":
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 text-[11px] py-0.5 animate-pulse">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" />
            PENDING_PAYMENT
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Order Microservice Operations</h2>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
              Port 3003
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Order lifecycle state machine, stock reservation orchestration, PostgreSQL ledger & payment event stream.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {totalCount} Total Orders
          </Badge>
          <Button size="sm" variant="outline" onClick={loadOrders} disabled={loading} className="gap-1.5 cursor-pointer">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* READ: Orders List Table */}
      <Card className="shadow-xs border-border/70 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Orders Directory</CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {totalCount} {totalCount === 1 ? "Order" : "Orders"}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                  GET /api/v1/orders
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Real-time user orders placed through the Storefront Cart UI with atomic stock tracking.
              </CardDescription>
            </div>

            {/* Quick search by ID */}
            <form onSubmit={handleSearchOrderById} className="flex items-center gap-2">
              <Input
                placeholder="Search Order UUID..."
                value={orderSearchId}
                onChange={(e) => setOrderSearchId(e.target.value)}
                className="h-8 text-xs font-mono w-48 sm:w-64"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={searchLoading} className="h-8 text-xs cursor-pointer gap-1">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3" />
                Find
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-xs w-[240px]">Order ID</TableHead>
                  <TableHead className="text-xs w-[160px]">Status</TableHead>
                  <TableHead className="text-xs w-[120px]">Items</TableHead>
                  <TableHead className="text-xs w-[140px]">Total Amount</TableHead>
                  <TableHead className="text-xs w-[180px]">Created At</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4 animate-spin" />
                        <span>Loading orders ledger...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs space-y-2">
                      <p>{hasToken ? "No orders found in your account yet." : "Please login in the Users tab to view authenticated orders."}</p>
                      <Button asChild size="sm" variant="outline" className="text-xs mt-2 cursor-pointer gap-1.5">
                        <Link href="/">
                          <span>Shop on Storefront</span>
                          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => {
                    return (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                        onClick={() => handleOpenInspector(o)}
                      >
                        <TableCell className="py-3 font-mono text-xs font-semibold text-primary">
                          <span className="truncate max-w-[200px] block" title={o.id}>
                            {o.id}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          {getStatusBadge(o.status)}
                        </TableCell>
                        <TableCell className="py-3 text-xs">
                          <Badge variant="outline" className="font-normal text-[11px]">
                            {o.items ? `${o.items.length} item(s)` : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 font-mono text-xs font-bold text-foreground">
                          ${o.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                            <span>{new Date(o.createdAt).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {o.status === "PENDING_PAYMENT" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer gap-1"
                                disabled={payingOrderId === o.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProcessPaymentForOrder(o);
                                }}
                              >
                                <HugeiconsIcon icon={RupeeIcon} strokeWidth={2} className="size-3" />
                                {payingOrderId === o.id ? "Paying..." : "Pay Now"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2.5 cursor-pointer gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInspector(o);
                              }}
                            >
                              Inspect
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Shadcn Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span> • Total {totalCount} orders
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

      {/* SLIDE-OUT ORDER INSPECTOR SHEET WITH PAYMENT DETAILS */}
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="right" className="flex flex-col w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl data-[side=right]:sm:max-w-xl data-[side=right]:md:max-w-2xl p-0 bg-background overflow-hidden">
          {selectedOrder && (
            <>
              {/* Sheet Header */}
              <SheetHeader className="p-4 sm:p-5 border-b border-border/70 flex-shrink-0">
                <div className="flex items-center justify-between pr-6">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-5" />
                    </span>
                    <div>
                      <SheetTitle className="text-base font-bold">Order Inspector</SheetTitle>
                      <SheetDescription className="text-xs font-mono">
                        GET /api/v1/orders/{selectedOrder.id.slice(0, 8)}...
                      </SheetDescription>
                    </div>
                  </div>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </SheetHeader>

              {/* Sheet Body Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
                {/* Overview Summary */}
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="text-muted-foreground font-medium">Order UUID</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-semibold text-primary">{selectedOrder.id}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedOrder.id, "Order ID")}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy Order ID"
                      >
                        <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="text-muted-foreground font-medium">Customer (User ID)</span>
                    <span className="font-mono text-muted-foreground">{selectedOrder.userId}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="text-muted-foreground font-medium">Order Date</span>
                    <span className="text-foreground">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Total Amount</span>
                    <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                      ${selectedOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-3 rounded-2xl bg-muted/20 border border-border/50 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-muted-foreground text-[11px]">
                    <HugeiconsIcon icon={DeliveryTruck01Icon} strokeWidth={2} className="size-3.5 text-emerald-600" />
                    <span>Shipping & Delivery Address</span>
                  </div>
                  <p className="text-foreground pl-5">{selectedOrder.shippingAddress || "Not specified"}</p>
                </div>

                {/* Reserved Line Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Reserved Line Items ({selectedOrder.items?.length || 0})
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                      PostgreSQL Reserved
                    </Badge>
                  </div>

                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 rounded-xl bg-background border border-border/60"
                        >
                          <div>
                            <span className="font-mono font-medium text-foreground block">{item.productId}</span>
                            <span className="text-[11px] text-muted-foreground">Quantity: {item.quantity} units</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-foreground block">
                              ${(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">(${item.unitPrice.toFixed(2)}/ea)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">No items recorded.</p>
                  )}
                </div>

                {/* REAL-TIME PAYMENT DETAILS (FROM PAYMENT MICROSERVICE :3004) */}
                <div className="space-y-2.5 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600">
                        <HugeiconsIcon icon={RupeeIcon} strokeWidth={2} className="size-3.5" />
                      </span>
                      <Label className="text-xs font-semibold text-foreground">Payment Microservice Record</Label>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-600 border-amber-500/30">
                      Port 3004
                    </Badge>
                  </div>

                  {loadingPayment ? (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center text-muted-foreground flex items-center justify-center gap-2">
                      <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4 animate-spin" />
                      <span>Checking payment ledger...</span>
                    </div>
                  ) : paymentDetails ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-500/10">
                        <span className="text-muted-foreground">Payment Status</span>
                        <Badge variant="default" className="bg-emerald-600 text-white text-[10px] gap-1">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3" />
                          {paymentDetails.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-emerald-500/10">
                        <span className="text-muted-foreground">Transaction Reference</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-medium text-foreground">
                            {paymentDetails.transactionReference || "tx_auto_confirmed"}
                          </span>
                          {paymentDetails.transactionReference && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentDetails.transactionReference!, "Transaction Ref")}
                              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy Reference"
                            >
                              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-emerald-500/10">
                        <span className="text-muted-foreground">Paid Amount</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${paymentDetails.amount.toFixed(2)} USD
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Processed At</span>
                        <span className="text-muted-foreground">
                          {new Date(paymentDetails.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : selectedOrder.status === "PENDING_PAYMENT" ? (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                      <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs">Payment Pending</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Order is waiting for payment settlement before fulfillment.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleProcessPaymentForOrder(selectedOrder)}
                        disabled={payingOrderId === selectedOrder.id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 rounded-xl cursor-pointer gap-1.5 shadow-sm"
                      >
                        {payingOrderId === selectedOrder.id ? (
                          <>
                            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5 animate-spin" />
                            <span>Authorizing Payment...</span>
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={RupeeIcon} strokeWidth={2} className="size-3.5" />
                            <span>Pay Now (${selectedOrder.totalAmount.toFixed(2)})</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/50 text-muted-foreground text-center">
                      No external payment record found.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
