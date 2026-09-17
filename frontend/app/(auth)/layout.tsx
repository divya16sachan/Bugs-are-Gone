import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShoppingBag03Icon,
  DeliveryTruck01Icon,
  SecurityLockIcon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";

// Rebrand by editing the name/logo here and your design tokens — no colors are
// hard-coded; the panel uses your primary token.
const perks = [
  { icon: DeliveryTruck01Icon, text: "Free, fast delivery on your first order" },
  { icon: SecurityLockIcon, text: "Secure checkout with encrypted payments" },
  { icon: Tag01Icon, text: "Members-only deals and early access to drops" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — hidden on mobile */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <HugeiconsIcon icon={ShoppingBag03Icon} size={26} />
          <span>YourShop</span>
        </Link>

        <div className="space-y-6">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Everything you love, delivered to your door.
          </h1>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
                  <HugeiconsIcon icon={p.icon} size={18} />
                </span>
                <span className="text-sm text-primary-foreground/90">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/70">
          &copy; {new Date().getFullYear()} YourShop. All rights reserved.
        </p>
      </aside>

      {/* Form area */}
      <main className="flex flex-col items-center justify-center px-6 py-10 sm:px-10">
        {/* Mobile-only logo */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-lg font-semibold lg:hidden"
        >
          <HugeiconsIcon icon={ShoppingBag03Icon} size={24} className="text-primary" />
          <span>YourShop</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
