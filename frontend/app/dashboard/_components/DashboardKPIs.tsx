"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  PackageIcon,
  ShoppingBag01Icon,
  RupeeIcon,
} from "@hugeicons/core-free-icons";
import { servicesApi } from "@/lib/services-api";
import { getAccessToken } from "@/lib/api-client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardKPIs() {
  const pathname = usePathname();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    setHasAuth(!!token);

    // Fetch quick counts
    servicesApi.getProducts({ limit: 1 }).then((res) => {
      setProductCount(res.totalCount);
    }).catch(() => {});

    if (token) {
      servicesApi.listOrders(1, 1).then((res) => {
        setOrderCount(res.totalCount);
      }).catch(() => {});
    }
  }, [pathname]);

  const cards = [
    {
      key: "users",
      url: "/dashboard/users",
      title: "User Service",
      port: ":3001",
      icon: <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />,
      status: hasAuth ? "Active Session" : "Ready / Public",
      statusColor: hasAuth ? "text-emerald-500" : "text-blue-500",
      stats: hasAuth ? "JWT Active" : "No Auth Token",
      bgGradient: "from-blue-500/10 hover:border-blue-500/50",
    },
    {
      key: "catalog",
      url: "/dashboard/catalog",
      title: "Catalog Service",
      port: ":3002",
      icon: <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className="size-4" />,
      status: "Redis Cached",
      statusColor: "text-emerald-500",
      stats: productCount !== null ? `${productCount} Products` : "Active",
      bgGradient: "from-emerald-500/10 hover:border-emerald-500/50",
    },
    {
      key: "orders",
      url: "/dashboard/orders",
      title: "Order Service",
      port: ":3003",
      icon: <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} className="size-4" />,
      status: "PostgreSQL",
      statusColor: "text-purple-500",
      stats: orderCount !== null ? `${orderCount} Orders` : "Queue Ready",
      bgGradient: "from-purple-500/10 hover:border-purple-500/50",
    },
    {
      key: "payments",
      url: "/dashboard/payments",
      title: "Payment Service",
      port: ":3004",
      icon: <HugeiconsIcon icon={RupeeIcon} strokeWidth={2} className="size-4" />,
      status: "RabbitMQ Consumer",
      statusColor: "text-amber-500",
      stats: "Worker Prefetch: 5",
      bgGradient: "from-amber-500/10 hover:border-amber-500/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((c) => {
        const isSelected = pathname === c.url || pathname.startsWith(`${c.url}/`);
        return (
          <Link key={c.key} href={c.url} className="block group">
            <Card
              className={`p-3.5 cursor-pointer transition-all border shadow-xs bg-gradient-to-br ${c.bgGradient} ${
                isSelected
                  ? "border-primary ring-1 ring-primary shadow-sm"
                  : "border-border/60 hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-background/80 shadow-xs border border-border/40 text-foreground group-hover:scale-105 transition-transform">
                    {c.icon}
                  </span>
                  <span className="font-semibold text-xs text-foreground">{c.title}</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] py-0">
                  {c.port}
                </Badge>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-base font-bold tracking-tight text-foreground">{c.stats}</span>
                <span className={`text-[11px] font-medium ${c.statusColor}`}>{c.status}</span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
