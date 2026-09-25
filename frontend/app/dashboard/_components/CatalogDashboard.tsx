"use client";

import React, { useState, useEffect } from "react";
import { servicesApi, ReserveStockResponse } from "@/lib/services-api";
import { Product } from "@/app/_components/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  RefreshIcon,
  Search01Icon,
  ShoppingBag01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link from "next/link";

export function CatalogDashboard() {
  const [products, setProducts] = useState<Product[]>([]);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchCategory, setSearchCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");

  // Selected Product for Details
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Stock Reservation
  const [reserveProductId, setReserveProductId] = useState<string>("");
  const [reserveQuantity, setReserveQuantity] = useState<number>(1);
  const [reserveOrderId, setReserveOrderId] = useState<string>(`ord_${Date.now().toString().slice(-5)}`);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [lastReservation, setLastReservation] = useState<ReserveStockResponse | null>(null);

  // Seed Catalog State
  const [seedLoading, setSeedLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [page, searchCategory, sortBy]);

  useEffect(() => {
    const handleSeeded = () => {
      setPage(1);
      loadProducts();
    };
    window.addEventListener("catalog:seeded", handleSeeded);
    return () => window.removeEventListener("catalog:seeded", handleSeeded);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await servicesApi.getProducts({
        category: searchCategory || undefined,
        sortBy: sortBy !== "default" ? sortBy : undefined,
        page,
        limit: 20,
      });
      setProducts(res.products || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      if (res.products && res.products.length > 0 && !reserveProductId) {
        setReserveProductId(res.products[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedCatalog = async () => {
    setSeedLoading(true);
    try {
      const res = await servicesApi.seedCatalog();
      toast.success(res.message || "Catalog seeded successfully with default products!");
      setPage(1);
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to seed catalog");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleFetchProductById = async (id: string) => {
    setDetailLoading(true);
    try {
      const prod = await servicesApi.getProductById(id);
      setSelectedProduct(prod);
      setReserveProductId(prod.id);
      toast.success(`Loaded product: ${prod.title}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch product details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReserveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveProductId || reserveQuantity <= 0) {
      toast.error("Please select a product and valid quantity");
      return;
    }
    setReserveLoading(true);
    try {
      const res = await servicesApi.reserveStock({
        orderId: reserveOrderId,
        items: [{ productId: reserveProductId, quantity: reserveQuantity }],
      });
      setLastReservation(res);
      toast.success(`Successfully reserved ${reserveQuantity} item(s)! Stock decremented in DB.`);
      // Reload products to reflect new stock
      await loadProducts();
      if (selectedProduct && selectedProduct.id === reserveProductId) {
        await handleFetchProductById(reserveProductId);
      }
      setReserveOrderId(`ord_${Date.now().toString().slice(-5)}`);
    } catch (err: any) {
      toast.error(err.message || "Stock reservation failed (Insufficient stock or not found)");
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className="size-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Catalog Microservice Operations</h2>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              Port 3002
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Redis Cache-Aside Layer, PostgreSQL Inventory, Multi-attribute Filtering & Atomic Stock Decrement Transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="font-mono text-xs">
            {totalCount} Total Products
          </Badge>
          <Button
            size="sm"
            variant="default"
            onClick={handleSeedCatalog}
            disabled={seedLoading}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
          >
            <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className={`size-3.5 ${seedLoading ? "animate-spin" : ""}`} />
            {seedLoading ? "Seeding DB..." : "Seed Catalog (15 Items)"}
          </Button>
          <Button size="icon"  tooltip="refresh" variant="outline" onClick={loadProducts} disabled={loading} className="gap-1.5 cursor-pointer">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* READ: Products Table & Filters (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">1. List Products (Query & Cache-Aside)</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    GET /api/v1/products with Redis cache acceleration.
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={searchCategory}
                    onChange={(e) => {
                      setSearchCategory(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-hidden"
                  >
                    <option value="">All Categories</option>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Fragrances">Fragrances</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-8 text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-hidden"
                  >
                    <option value="default">Default Sort</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="best-selling">Best Selling</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[60px] text-xs">Image</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Price</TableHead>
                      <TableHead className="text-xs">Stock</TableHead>
                      <TableHead className="text-right text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                          Loading products from Catalog Service...
                        </TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                          No products found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((p) => {
                        const stockCount = (p as any).stock ?? (p.inStock ? 50 : 0);
                        const isSelected = selectedProduct?.id === p.id;
                        return (
                          <TableRow
                            key={p.id}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-muted/70" : "hover:bg-muted/30"
                            }`}
                            onClick={() => handleFetchProductById(p.id)}
                          >
                            <TableCell className="py-2">
                              <div className="relative size-10 rounded-lg overflow-hidden border border-border/60 bg-muted/30">
                                {p.imageUrl ? (
                                  <Image
                                    src={p.imageUrl}
                                    alt={p.title}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                                    IMG
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="font-medium text-xs leading-snug line-clamp-1">{p.title}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{p.id}</div>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-[10px] py-0">
                                {p.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 font-mono text-xs font-semibold">
                              ${p.price.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge
                                variant={stockCount > 0 ? "secondary" : "destructive"}
                                className={`text-[10px] py-0 ${
                                  stockCount > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""
                                }`}
                              >
                                {stockCount} in stock
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFetchProductById(p.id);
                                }}
                              >
                                View ID
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-3 border-t border-border/50 text-xs text-muted-foreground">
                <span>Page {page} of {totalPages} ({totalCount} total)</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs cursor-pointer"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs cursor-pointer"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DETAILS & UPDATE: Stock Reservation & Product Detail (1 Column, Sticky Aside) */}
        <aside className="space-y-4 lg:sticky lg:top-[72px] self-start max-h-[calc(100vh-88px)] overflow-y-auto pr-0.5">
          {/* UPDATE: Reserve Stock Tool */}
          <Card className="shadow-xs border-border/70 border-emerald-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">2. Update Stock (Reserve)</CardTitle>
                <Badge variant="secondary" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600">
                  POST /reserve
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Atomic PostgreSQL transaction: decrements stock & invalidates Redis cache.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleReserveStock}>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="res-prod-id" className="text-xs">Target Product</Label>
                  <select
                    id="res-prod-id"
                    value={reserveProductId}
                    onChange={(e) => setReserveProductId(e.target.value)}
                    className="w-full h-9 text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (${p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="res-qty" className="text-xs">Quantity</Label>
                    <Input
                      id="res-qty"
                      type="number"
                      min={1}
                      max={100}
                      value={reserveQuantity}
                      onChange={(e) => setReserveQuantity(parseInt(e.target.value, 10) || 1)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="res-order" className="text-xs">Order Ref</Label>
                    <Input
                      id="res-order"
                      value={reserveOrderId}
                      onChange={(e) => setReserveOrderId(e.target.value)}
                      className="h-8 text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                {lastReservation && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-emerald-600">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                      Stock Reserved Successfully
                    </div>
                    <div className="text-muted-foreground">Order ID: {lastReservation.orderId}</div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-end">
                <Button type="submit" size="sm" disabled={reserveLoading} className="w-full cursor-pointer">
                  {reserveLoading ? "Reserving..." : "Execute Stock Decrement"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* READ: Product Detail Inspector */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">3. Read Product Details</CardTitle>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  GET /:id
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Direct lookup by product UUID with cached response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detailLoading ? (
                <div className="text-center py-6 text-xs text-muted-foreground">Loading product details...</div>
              ) : selectedProduct ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative size-14 rounded-lg overflow-hidden border border-border bg-muted/40 shrink-0">
                      {selectedProduct.imageUrl && (
                        <Image src={selectedProduct.imageUrl} alt={selectedProduct.title} fill className="object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedProduct.title}</div>
                      <div className="text-muted-foreground font-mono text-[11px]">{selectedProduct.id}</div>
                      <div className="text-primary font-bold mt-0.5">${selectedProduct.price.toFixed(2)}</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-[11px] line-clamp-3">
                    {selectedProduct.description || "No description available."}
                  </p>

                  <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Rating:</span> {selectedProduct.rating} ★ ({selectedProduct.reviewCount})
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock:</span> {(selectedProduct as any).stock ?? (selectedProduct.inStock ? 50 : 0)}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      <Link href={`/${selectedProduct.id}`}>
                        <span>View Product Page (/{selectedProduct.id})</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Select a product from the table to view its live record.
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

