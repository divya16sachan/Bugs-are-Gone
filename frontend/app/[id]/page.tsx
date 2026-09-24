import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductById } from "@/lib/catalog-api";
import { ShopNavbar } from "../_components/shop-navbar";
import { ShopFooter } from "../_components/shop-footer";
import { BackButton } from "./_components/back-button";
import ProductDetailClient from "./_components/product-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | Beauty Shop",
    };
  }

  return {
    title: `${product.title} | Beauty Shop`,
    description: product.description,
  };
}

import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons";

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3010";

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Navigation Header */}
      <ShopNavbar />

      <main className="flex-1">
        {/* Top Product Detail Bar: Back Navigation & Grafana Monitoring */}
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <BackButton />

          {/* Grafana Monitoring Access - STRICTLY ON TOP OF PRODUCT DETAILS PAGE ONLY */}
          <a
            href={grafanaUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="grafana-monitoring-btn"
            aria-label="Open Grafana Monitoring Dashboard in a new tab"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
          >
            <HugeiconsIcon icon={DashboardSquare01Icon} className="size-4 text-emerald-700 dark:text-emerald-400" />
            <span>Monitoring</span>
            <HugeiconsIcon icon={LinkSquare02Icon} className="size-3.5 text-emerald-600/80 dark:text-emerald-400/80" />
          </a>
        </div>

        <ProductDetailClient id={id} initialProduct={product} />
      </main>

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
