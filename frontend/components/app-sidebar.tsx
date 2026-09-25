"use client";

import * as React from "react";
import { NavMain, NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  PackageIcon,
  ShoppingBag01Icon,
  RupeeIcon,
} from "@hugeicons/core-free-icons";
import {
  GrafanaIcon,
  PrometheusIcon,
  RabbitMQIcon,
  JaegerIcon,
  AlertmanagerIcon,
} from "@/components/monitoring-icons";
import Link from "next/link";
import Image from "next/image";

const microservicesNavItems: NavItem[] = [
  {
    title: "Users Service",
    key: "users",
    url: "/dashboard/users",
    icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4 shrink-0" />,
    badge: ":3001",
    description: "Auth, Profiles & JWT Management",
  },
  {
    title: "Catalog Service",
    key: "catalog",
    url: "/dashboard/catalog",
    icon: <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className="size-4 shrink-0" />,
    badge: ":3002",
    description: "Products, Inventory & Stock Reservation",
  },
  {
    title: "Orders Service",
    key: "orders",
    url: "/dashboard/orders",
    icon: <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-4 shrink-0" />,
    badge: ":3003",
    description: "Order Processing, Checkout & Statuses",
  },
  {
    title: "Payments Service",
    key: "payments",
    url: "/dashboard/payments",
    icon: <HugeiconsIcon icon={RupeeIcon} strokeWidth={2} className="size-4 shrink-0" />,
    badge: ":3004",
    description: "Sync Fallback & RabbitMQ Event Processing",
  },
];

const observabilityNavItems: NavItem[] = [
  {
    title: "Grafana",
    key: "grafana",
    url: process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3010",
    icon: <GrafanaIcon className="size-4 shrink-0 text-orange-500" />,
    badge: ":3010",
    isExternal: true,
    description: "RED Signals & Health Dashboards",
  },
  {
    title: "Prometheus",
    key: "prometheus",
    url: process.env.NEXT_PUBLIC_PROMETHEUS_URL || "http://localhost:9090/targets",
    icon: <PrometheusIcon className="size-4 shrink-0 text-amber-500" />,
    badge: ":9090",
    isExternal: true,
    description: "PromQL Metrics & Alert Rules",
  },
  {
    title: "RabbitMQ",
    key: "rabbitmq",
    url: process.env.NEXT_PUBLIC_RABBITMQ_URL || "http://localhost:15672",
    icon: <RabbitMQIcon className="size-4 shrink-0 text-[#FF6600]" />,
    badge: ":15672",
    isExternal: true,
    description: "Queue Management & Broker Status",
  },
  {
    title: "Jaeger Tracing",
    key: "jaeger",
    url: process.env.NEXT_PUBLIC_JAEGER_URL || "http://localhost:16686",
    icon: <JaegerIcon className="size-4 shrink-0 text-cyan-500" />,
    badge: ":16686",
    isExternal: true,
    description: "Distributed Tracing & Spans",
  },
  {
    title: "Alertmanager",
    key: "alertmanager",
    url: process.env.NEXT_PUBLIC_ALERTMANAGER_URL || "http://localhost:9093",
    icon: <AlertmanagerIcon className="size-4 shrink-0 text-rose-500" />,
    badge: ":9093",
    isExternal: true,
    description: "Active Alerts & Silence Rules",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip="Home (Bugs-are-Gone)"
              className="cursor-pointer group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center! hover:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Beauty Shop"
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-cover transition-transform group-hover:scale-105 shadow-xs shrink-0"
                  priority
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
                  Bugs-are-Gone
                </span>
                <span className="truncate text-xs text-muted-foreground font-mono">
                  SRE & CRUD Control
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-2 space-y-1">
        <NavMain label="Microservices Platform" items={microservicesNavItems} />
        <NavMain label="Observability & SRE" items={observabilityNavItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
