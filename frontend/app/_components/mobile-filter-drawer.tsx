"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { FilterSidebar } from "./filter-sidebar";
import { ProductFilters } from "./types";

interface MobileFilterDrawerProps {
  filters: ProductFilters;
  onFilterChange: (updater: (prev: ProductFilters) => ProductFilters) => void;
  className?: string;
}

export function MobileFilterDrawer({
  filters,
  onFilterChange,
  className,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("lg:hidden", className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn("flex items-center gap-2 border-border")}
            />
          }
        >
          <HugeiconsIcon icon={FilterIcon} className={cn("size-4")} />
          <span>Filters</span>
        </SheetTrigger>
        <SheetContent side="left" className={cn("w-80 overflow-y-auto p-6")}>
          <SheetHeader className={cn("px-0 pt-0 pb-4")}>
            <SheetTitle className={cn("text-lg font-bold text-foreground")}>
              Filter Products
            </SheetTitle>
          </SheetHeader>
          <div className={cn("py-2")}>
            <FilterSidebar filters={filters} onFilterChange={onFilterChange} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
