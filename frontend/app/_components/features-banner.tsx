import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DeliveryTruck01Icon,
  CreditCardIcon,
  CustomerSupportIcon,
} from "@hugeicons/core-free-icons";

const FEATURES = [
  {
    icon: DeliveryTruck01Icon,
    title: "Free Shipping",
    description: "Free shipping for order above $50",
  },
  {
    icon: CreditCardIcon,
    title: "Flexible Payment",
    description: "Multiple secure payment options",
  },
  {
    icon: CustomerSupportIcon,
    title: "24×7 Support",
    description: "We support online all days.",
  },
];

export function FeaturesBanner() {
  return (
    <section className={cn("w-full border-t border-border/80 bg-stone-50/50 dark:bg-stone-900/30 py-12 mt-12")}>
      <div className={cn("max-w-7xl mx-auto px-4")}>
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12")}>
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={cn("flex items-center gap-4 group")}
            >
              <div
                className={cn(
                  "size-12 shrink-0 rounded-full bg-emerald-950 text-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 flex items-center justify-center transition-transform group-hover:scale-105"
                )}
              >
                <HugeiconsIcon icon={feature.icon} className={cn("size-6")} />
              </div>
              <div className={cn("flex flex-col")}>
                <h4 className={cn("text-base font-semibold text-foreground")}>
                  {feature.title}
                </h4>
                <p className={cn("text-xs text-muted-foreground")}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
