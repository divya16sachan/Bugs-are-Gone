import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Call02Icon,
  Facebook01Icon,
  TwitterIcon,
  PinterestIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons";

export function ShopAnnouncement() {
  return (
    <div
      className={cn(
        "w-full bg-emerald-950 text-emerald-100 text-xs py-2 px-4 select-none"
      )}
    >
      <div className={cn("max-w-7xl mx-auto flex items-center justify-between gap-4")}>
        {/* Left: Contact Phone */}
        <div className={cn("hidden sm:flex items-center gap-2")}>
          <HugeiconsIcon icon={Call02Icon} className={cn("size-3.5 text-emerald-300")} />
          <span>Call Us : +123-456-789</span>
        </div>

        {/* Center: Promotional Message */}
        <div className={cn("flex-1 text-center font-normal")}>
          <span>Sign up and GET 20% OFF for your first order. </span>
          <a
            href="#"
            className={cn(
              "font-medium underline underline-offset-4 text-white hover:text-emerald-200 transition-colors"
            )}
          >
            Sign up now
          </a>
        </div>

        {/* Right: Social Links */}
        <div className={cn("hidden md:flex items-center gap-3")}>
          <a
            href="#"
            aria-label="Facebook"
            className={cn("text-emerald-200 hover:text-white transition-colors")}
          >
            <HugeiconsIcon icon={Facebook01Icon} className={cn("size-3.5")} />
          </a>
          <a
            href="#"
            aria-label="Twitter"
            className={cn("text-emerald-200 hover:text-white transition-colors")}
          >
            <HugeiconsIcon icon={TwitterIcon} className={cn("size-3.5")} />
          </a>
          <a
            href="#"
            aria-label="Pinterest"
            className={cn("text-emerald-200 hover:text-white transition-colors")}
          >
            <HugeiconsIcon icon={PinterestIcon} className={cn("size-3.5")} />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className={cn("text-emerald-200 hover:text-white transition-colors")}
          >
            <HugeiconsIcon icon={InstagramIcon} className={cn("size-3.5")} />
          </a>
          <a
            href="#"
            aria-label="YouTube"
            className={cn("text-emerald-200 hover:text-white transition-colors")}
          >
            <HugeiconsIcon icon={YoutubeIcon} className={cn("size-3.5")} />
          </a>
        </div>
      </div>
    </div>
  );
}
