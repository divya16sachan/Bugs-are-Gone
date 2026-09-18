import { cn } from "@/lib/utils";

export function CatalogSkeleton() {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 py-8 select-none")}>
      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-8")}>
        {/* Left Column: Filter Sidebar Skeleton */}
        <div className={cn("hidden lg:block lg:col-span-1")}>
          <div className={cn("sticky top-20 space-y-7 pr-4")}>
            <div className={cn("h-6 w-32 bg-muted rounded-md animate-pulse")} />

            {/* Section 1 */}
            <div className={cn("space-y-3")}>
              <div className={cn("h-4 w-24 bg-muted rounded animate-pulse")} />
              <div className={cn("space-y-2.5")}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn("flex items-center gap-3")}>
                    <div className={cn("size-4 bg-muted rounded animate-pulse")} />
                    <div className={cn("h-3.5 w-20 bg-muted/70 rounded animate-pulse")} />
                  </div>
                ))}
              </div>
            </div>

            <div className={cn("h-px w-full bg-border/60")} />

            {/* Section 2 */}
            <div className={cn("space-y-3")}>
              <div className={cn("h-4 w-28 bg-muted rounded animate-pulse")} />
              <div className={cn("space-y-2.5")}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cn("flex items-center gap-3")}>
                    <div className={cn("size-4 bg-muted rounded animate-pulse")} />
                    <div className={cn("h-3.5 w-24 bg-muted/70 rounded animate-pulse")} />
                  </div>
                ))}
              </div>
            </div>

            <div className={cn("h-px w-full bg-border/60")} />

            {/* Section 3: Slider */}
            <div className={cn("space-y-3")}>
              <div className={cn("h-4 w-16 bg-muted rounded animate-pulse")} />
              <div className={cn("h-3 w-28 bg-muted/70 rounded animate-pulse")} />
              <div className={cn("h-2 w-full bg-muted rounded-full animate-pulse")} />
            </div>
          </div>
        </div>

        {/* Right Column: Catalog Grid Skeleton */}
        <div className={cn("lg:col-span-3 flex flex-col")}>
          {/* Toolbar Skeleton */}
          <div className={cn("flex items-center justify-between pb-6 gap-4")}>
            <div className={cn("h-4 w-40 bg-muted rounded animate-pulse")} />
            <div className={cn("h-9 w-36 bg-muted rounded-md animate-pulse")} />
          </div>

          {/* 9 Product Cards Skeleton */}
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6")}>
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col"
                )}
              >
                <div className={cn("aspect-square w-full bg-muted animate-pulse")} />
                <div className={cn("p-4 space-y-3 flex-1 flex flex-col justify-between")}>
                  <div className={cn("flex items-center justify-between")}>
                    <div className={cn("h-3 w-16 bg-muted rounded animate-pulse")} />
                    <div className={cn("h-3 w-10 bg-muted rounded animate-pulse")} />
                  </div>
                  <div className={cn("h-4 w-4/5 bg-muted rounded animate-pulse")} />
                  <div className={cn("h-4 w-1/3 bg-muted rounded animate-pulse pt-1")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
