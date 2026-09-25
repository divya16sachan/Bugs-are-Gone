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
      <div className="flex md:flex-row flex-col justify-between md:items-center gap-4 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent backdrop-blur-xs p-5 border border-emerald-500/20 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className="size-5" />
            </span>
            <h2 className="font-bold text-xl tracking-tight">Catalog Microservice Operations</h2>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              Port 3002
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            Redis Cache-Aside Layer, PostgreSQL Inventory, Multi-attribute Filtering & Atomic Stock Decrement Transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {totalCount} Total Products
          </Badge>
          <Button
            size="sm"
            variant="default"
            onClick={handleSeedCatalog}
            disabled={seedLoading}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 shadow-xs text-white cursor-pointer"
          >
            <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className={`size-3.5 ${seedLoading ? "animate-spin" : ""}`} />
            {seedLoading ? "Seeding DB..." : "Seed Catalog (15 Items)"}
          </Button>
          <Button size="icon"  tooltip="refresh" variant="outline" onClick={loadProducts} disabled={loading} className="gap-1.5 cursor-pointer">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>


      <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* READ: Products Table & Filters (2 Columns) */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-semibold text-base">1. List Products (Query & Cache-Aside)</CardTitle>
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
                    className="bg-background px-2.5 py-1 border border-border rounded-lg focus:outline-hidden h-8 text-foreground text-xs"
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
                    className="bg-background px-2.5 py-1 border border-border rounded-lg focus:outline-hidden h-8 text-foreground text-xs"
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
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-muted-foreground text-xs text-center">
                          Loading products from Catalog Service...
                        </TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-muted-foreground text-xs text-center">
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
                              <div className="relative bg-muted/30 border border-border/60 rounded-lg size-10 overflow-hidden">
                                {p.imageUrl ? (
                                  <Image
                                    src={p.imageUrl}
                                    alt={p.title}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="flex justify-center items-center w-full h-full text-[10px] text-muted-foreground">
                                    IMG
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="font-medium text-xs line-clamp-1 leading-snug">{p.title}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{p.id}</div>
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="py-0 text-[10px]">
                                {p.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 font-mono font-semibold text-xs">
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
                                className="px-2 h-7 text-xs cursor-pointer"
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
              <div className="flex justify-between items-center p-3 border-border/50 border-t text-muted-foreground text-xs">
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
        <aside className="lg:top-[72px] lg:sticky self-start space-y-4 pr-0.5 max-h-[calc(100vh-88px)] overflow-y-auto">
          {/* UPDATE: Reserve Stock Tool */}
          <Card className="shadow-xs border-border/70 border-emerald-500/30">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="font-semibold text-base">2. Update Stock (Reserve)</CardTitle>
                <Badge variant="secondary" className="bg-emerald-500/10 font-mono text-[10px] text-emerald-600">
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
                    className="bg-background px-2.5 py-1 border border-border rounded-lg focus:outline-hidden w-full h-9 text-foreground text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (${p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gap-2 grid grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="res-qty" className="text-xs">Quantity</Label>
                    <Input
                      id="res-qty"
                      type="number"
                      min={1}
                      max={100}
                      value={reserveQuantity}
                      onChange={(e) => setReserveQuantity(parseInt(e.target.value, 10) || 1)}
                      className="h-8 font-mono text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="res-order" className="text-xs">Order Ref</Label>
                    <Input
                      id="res-order"
                      value={reserveOrderId}
                      onChange={(e) => setReserveOrderId(e.target.value)}
                      className="h-8 font-mono text-xs"
                      required
                    />
                  </div>
                </div>

                {lastReservation && (
                  <div className="space-y-1 bg-emerald-500/10 p-2.5 border border-emerald-500/20 rounded-lg text-[11px]">
                    <div className="flex items-center gap-1 font-semibold text-emerald-600">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                      Stock Reserved Successfully
                    </div>
                    <div className="text-muted-foreground">Order ID: {lastReservation.orderId}</div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end pt-0">
                <Button type="submit" size="sm" disabled={reserveLoading} className="w-full cursor-pointer">
                  {reserveLoading ? "Reserving..." : "Execute Stock Decrement"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* READ: Product Detail Inspector */}
          <Card className="shadow-xs border-border/70">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="font-semibold text-base">3. Read Product Details</CardTitle>
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
                <div className="py-6 text-muted-foreground text-xs text-center">Loading product details...</div>
              ) : selectedProduct ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative bg-muted/40 border border-border rounded-lg size-14 overflow-hidden shrink-0">
                      {selectedProduct.imageUrl && (
                        <Image src={selectedProduct.imageUrl} alt={selectedProduct.title} fill className="object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{selectedProduct.title}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{selectedProduct.id}</div>
                      <div className="mt-0.5 font-bold text-primary">${selectedProduct.price.toFixed(2)}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-3">
                    {selectedProduct.description || "No description available."}
                  </p>

                  <div className="gap-2 grid grid-cols-2 pt-2 border-border/40 border-t text-[11px]">
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
                      className="gap-1.5 hover:bg-primary/10 border-primary/40 w-full text-primary text-xs cursor-pointer"
                    >
                      <Link href={`/${selectedProduct.id}`}>
                        <span>View Product Page (/{selectedProduct.id})</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-muted-foreground text-xs text-center">
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

