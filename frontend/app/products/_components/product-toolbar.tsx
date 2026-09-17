"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption } from "./types";

interface ProductToolbarProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
  mobileFilterTrigger?: React.ReactNode;
}

export function ProductToolbar({
  totalCount,
  currentPage,
  pageSize,
  sortBy,
  onSortChange,
  className,
  mobileFilterTrigger,
}: ProductToolbarProps) {
  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 select-none",
        className
      )}
    >
      <div className={cn("flex items-center gap-3 w-full sm:w-auto justify-between")}>
        {/* Results Counter */}
        <p className={cn("text-sm text-muted-foreground font-normal")}>
          Showing {startItem}-{endItem} of {totalCount} results
        </p>

        {/* Mobile Filter Button */}
        {mobileFilterTrigger}
      </div>

      {/* Sort Dropdown */}
      <div className={cn("flex items-center gap-2.5 self-end sm:self-auto")}>
        <span className={cn("text-sm text-muted-foreground font-normal whitespace-nowrap")}>
          Sort by :
        </span>
        <Select
          value={sortBy}
          onValueChange={(val) => onSortChange(val as SortOption)}
        >
          <SelectTrigger className={cn("h-9 min-w-36 text-sm border-border bg-background font-normal")}>
            <SelectValue placeholder="Default Sorting" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="default">Default Sorting</SelectItem>
            <SelectItem value="best-selling">Best Sellers</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating-desc">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
