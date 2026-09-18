"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft01Icon } from "./icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleBack}
      tooltip="Back to products"
      aria-label="Back to products"
      className={cn(
        "size-10 rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 shadow-xs transition-all hover:scale-105 active:scale-95",
        className
      )}
    >
      <ArrowLeft01Icon size={20} />
    </Button>
  );
}
