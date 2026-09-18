"use client";

import "highlight.js/styles/atom-one-dark.css";
import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Book02Icon,
  Menu01Icon,
  Cancel01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const toc: TocItem[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      const text = h2Match[1].trim();
      toc.push({ id: slugify(text), text, level: 2 });
      continue;
    }

    const h3Match = line.match(/^###\s+(.+)$/);
    if (h3Match) {
      const text = h3Match[1].trim();
      toc.push({ id: slugify(text), text, level: 3 });
      continue;
    }
  }

  return toc;
}

export function DocsViewer({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const toc = useMemo(() => extractToc(content), [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll("h2, h3");
      let currentActive = "";
      const scrollPosition = window.scrollY + 120;

      headings.forEach((heading) => {
        const top = (heading as HTMLElement).offsetTop;
        if (scrollPosition >= top) {
          currentActive = heading.id;
        }
      });

      if (currentActive) {
        setActiveId(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 90;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveId(id);
      setMobileTocOpen(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Table of Contents Toggle */}
      <div className="lg:hidden mb-6 flex items-center justify-between p-3.5 bg-muted/60 rounded-xl border border-border">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HugeiconsIcon icon={Book02Icon} className="size-4 text-emerald-700" />
          <span>Table of Contents</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileTocOpen(!mobileTocOpen)}
          className="p-1.5 rounded-lg hover:bg-muted text-foreground cursor-pointer"
          aria-label="Toggle Table of Contents"
        >
          <HugeiconsIcon icon={mobileTocOpen ? Cancel01Icon : Menu01Icon} className="size-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileTocOpen && (
        <div className="lg:hidden mb-8 p-4 bg-card rounded-2xl border border-border shadow-lg animate-in fade-in duration-200">
          <nav className="space-y-1.5 text-sm max-h-80 overflow-y-auto pr-2">
            {toc.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "w-full text-left py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-between",
                  item.level === 3 && "pl-6 text-xs",
                  activeId === item.id
                    ? "bg-emerald-950 text-white font-medium dark:bg-emerald-800"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span className="truncate">{item.text}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Main Markdown Article (Left 3 Columns) using Tailwind Typography */}
        <article className="lg:col-span-3 min-w-0 max-w-none prose prose-stone dark:prose-invert prose-headings:font-serif prose-headings:tracking-tight prose-headings:scroll-mt-24 prose-a:text-emerald-800 dark:prose-a:text-emerald-400 prose-pre:bg-transparent prose-pre:p-0 prose-table:overflow-x-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h2: ({ children }) => {
                const text = String(children);
                const id = slugify(text);
                return (
                  <h2 id={id} className="group flex items-center gap-2">
                    <span>{text}</span>
                    <a
                      href={`#${id}`}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity no-underline"
                      aria-label={`Link to ${text}`}
                    >
                      <HugeiconsIcon icon={Link01Icon} className="size-4" />
                    </a>
                  </h2>
                );
              },
              h3: ({ children }) => {
                const text = String(children);
                const id = slugify(text);
                return (
                  <h3 id={id} className="group flex items-center gap-2">
                    <span>{text}</span>
                    <a
                      href={`#${id}`}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity no-underline"
                      aria-label={`Link to ${text}`}
                    >
                      <HugeiconsIcon icon={Link01Icon} className="size-3.5" />
                    </a>
                  </h3>
                );
              },
              pre: ({ children }) => <>{children}</>,
              code: ({ className, children }: any) => {
                const isInline = !className;
                return (
                  <CodeBlock className={className} inline={isInline}>
                    {children}
                  </CodeBlock>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Sticky Table of Contents Sidebar (Right Column) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 [scrollbar-width:thin]">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <HugeiconsIcon icon={Book02Icon} className="size-4 text-emerald-800 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  On This Page
                </span>
              </div>

              <nav className="space-y-1 text-sm">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToHeading(item.id)}
                    className={cn(
                      "w-full text-left py-1 px-2.5 rounded-md transition-colors cursor-pointer text-xs truncate block",
                      item.level === 3 && "pl-5 text-muted-foreground",
                      activeId === item.id
                        ? "bg-emerald-950 text-white font-medium dark:bg-emerald-800"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
