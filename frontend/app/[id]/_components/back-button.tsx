"use client";

import Link from "next/link";
import { ArrowLeft01Icon } from "./icons";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  return (
    <Link
      href="/"
      aria-label="Back to products"
      className={cn(
        "inline-flex items-center justify-center size-10 rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 shadow-xs transition-all hover:scale-105 active:scale-95",
        className
      )}
    >
      <ArrowLeft01Icon size={20} />
    </Link>
  );
}
