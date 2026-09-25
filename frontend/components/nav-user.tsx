"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, useLogout } from "@/features/auth/hooks";
import { getUserAvatar } from "@/lib/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Login01Icon,
  Logout01Icon,
  Mail01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export function NavUser() {
  const { data: user, isLoading } = useSession();
  const logout = useLogout();

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-2.5 w-32 rounded" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            render={<Link href="/login" />}
            tooltip="Sign In"
            className="cursor-pointer group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center! hover:bg-sidebar-accent text-primary font-medium"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <HugeiconsIcon icon={Login01Icon} strokeWidth={2} className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-xs text-sidebar-foreground">Sign In</span>
              <span className="truncate text-[11px] text-muted-foreground">Access your account</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const displayName = user.name || "User";
  const displayEmail = user.email;
  const avatarSrc = getUserAvatar(user.id, user.email);
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={displayName}
                className="cursor-pointer group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center! hover:bg-sidebar-accent w-full"
              >
                <Avatar className="size-8 rounded-lg border border-sidebar-border/60 shrink-0">
                  <AvatarImage
                    src={avatarSrc}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-xs text-sidebar-foreground">{displayName}</span>
                  </div>
                  <span className="truncate text-[11px] text-muted-foreground font-mono">{displayEmail}</span>
                </div>
              </SidebarMenuButton>
            }
          />

          <PopoverContent
            side="right"
            align="end"
            sideOffset={8}
            className="w-64 p-0 rounded-xl shadow-xl border border-border/80 overflow-hidden bg-background"
          >
            <div className="p-3 bg-muted/40">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 rounded-full border border-border shrink-0 shadow-xs">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="bg-emerald-900 text-emerald-100 font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-xs text-foreground truncate">
                    {displayName}
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                    <HugeiconsIcon icon={Mail01Icon} className="size-3 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{displayEmail}</span>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="p-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2 h-8 rounded-lg font-medium text-xs transition-colors cursor-pointer"
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
                Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

