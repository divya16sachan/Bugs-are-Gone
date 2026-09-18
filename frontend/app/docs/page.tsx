import fs from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import { ShopNavbar } from "../_components/shop-navbar";
import { ShopFooter } from "../_components/shop-footer";
import { DocsViewer } from "./_components/docs-viewer";

export const metadata: Metadata = {
  title: "API Documentation | Beauty Shop Microservices",
  description:
    "Interactive developer documentation for User, Catalog, Order, and Payment microservices APIs.",
};

async function getDocsContent(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "content", "api-docs.md");
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Failed to read api-docs.md:", error);
    return "# API Documentation\n\nFailed to load documentation content.";
  }
}

export default async function DocsPage() {
  const content = await getDocsContent();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navigation Header */}
      <ShopNavbar />

      {/* Hero Header Banner */}
      <section className="w-full py-10 bg-gradient-to-b from-stone-50 via-stone-50 to-background dark:from-stone-950 dark:via-stone-900 dark:to-background border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              REST & Async Events
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              API Documentation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore endpoints, schemas, authentication, and examples for all 4 microservices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
              Gateway: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">:8080</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Documentation Viewer with Sticky TOC */}
      <main className="flex-1">
        <DocsViewer content={content} />
      </main>

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
