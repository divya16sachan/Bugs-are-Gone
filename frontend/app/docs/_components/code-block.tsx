"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, CheckmarkSquare02Icon } from "@hugeicons/core-free-icons";

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (typeof node === "object" && "props" in (node as any) && (node as any).props?.children) {
    return getNodeText((node as any).props.children);
  }
  return "";
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const text = getNodeText(children).replace(/\n$/, "");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-muted text-emerald-800 dark:text-emerald-300 font-mono text-xs md:text-sm font-semibold">
        {children}
      </code>
    );
  }

  // Detect language if provided in className (e.g. language-json, language-bash, hljs)
  const langMatch = className?.match(/language-([a-z0-9_-]+)/i);
  const language = langMatch ? langMatch[1] : "";

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs font-mono text-zinc-400">
        <span className="font-semibold uppercase tracking-wider">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          <HugeiconsIcon
            icon={copied ? CheckmarkSquare02Icon : Copy01Icon}
            className={`size-3.5 ${copied ? "text-emerald-400" : ""}`}
          />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto text-xs md:text-sm font-mono leading-relaxed select-text">
        <pre className="!bg-transparent !p-0 !m-0">
          <code className={className}>{children}</code>
        </pre>
      </div>
    </div>
  );
}
