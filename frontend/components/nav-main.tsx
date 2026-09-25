"use client";

import * as React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  title: string;
  key: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  badge?: string;
  description?: string;
  isExternal?: boolean;
}

export function NavMain({
  label = "Microservices Platform",
  items,
}: {
  label?: string;
  items: NavItem[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isSelected =
            !item.isExternal &&
            (pathname === item.url || pathname.startsWith(`${item.url}/`));

          return (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                render={
                  item.isExternal ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ) : (
                    <Link href={item.url} />
                  )
                }
                isActive={isSelected}
                tooltip={`${item.title}${item.isExternal ? " (External)" : ""}`}
                className={`cursor-pointer transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-primary! text-primary-foreground! font-semibold shadow-sm hover:bg-primary/95! hover:text-primary-foreground!"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left truncate">{item.title}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.isExternal ? (
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    strokeWidth={2}
                    className="size-3.5 text-muted-foreground/60 shrink-0"
                  />
                ) : (
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className={`size-3.5 transition-transform duration-200 shrink-0 ${
                      isSelected
                        ? "translate-x-0.5 text-primary-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
