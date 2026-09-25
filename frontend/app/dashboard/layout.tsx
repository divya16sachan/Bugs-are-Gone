"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardKPIs } from "./_components/DashboardKPIs";
import { usePathname } from "next/navigation";
import { NavActions } from "@/components/nav-actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getBreadcrumbTitle = () => {
    if (pathname.includes("/catalog")) return "Catalog Microservice (Port 3002)";
    if (pathname.includes("/orders")) return "Orders Microservice (Port 3003)";
    if (pathname.includes("/payments")) return "Payments Microservice (Port 3004)";
    if (pathname.includes("/users")) return "Users Microservice (Port 3001)";
    return "Microservices Dashboard Overview";
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-background/95">
        {/* Top Header & Dynamic Route Breadcrumbs */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md transition-[width,height] ease-linear">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator orientation="vertical" className="mr-2 h-4 self-center!" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/" className="text-xs text-muted-foreground hover:text-foreground">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-semibold text-foreground">
                    {getBreadcrumbTitle()}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Shared Right Actions (API Docs, Switcher, Wishlist, Cart, User Popover) */}
          <NavActions />
        </header>

        {/* Main Dashboard Workspace */}
        <main className="flex-1 space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {/* Microservices KPI Bar (Route Link Activated) */}
          <DashboardKPIs />

          {/* Dedicated Route Page Content */}
          <div className="transition-all duration-200">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
