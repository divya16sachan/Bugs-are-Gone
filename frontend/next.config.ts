import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@hugeicons/react",
      "@hugeicons/core-free-icons",
      "@base-ui/react",
      "@tanstack/react-query",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Proxy API requests to backend microservices (eliminates CORS — all
  // requests are same-origin from the browser's perspective).
  async rewrites() {
    return [
      // User service: auth + users
      { source: "/api/v1/auth/:path*", destination: "http://localhost:3001/api/v1/auth/:path*" },
      { source: "/api/v1/users/:path*", destination: "http://localhost:3001/api/v1/users/:path*" },
      { source: "/api/v1/users", destination: "http://localhost:3001/api/v1/users" },
      // Catalog service: products
      { source: "/api/v1/products/:path*", destination: "http://localhost:3002/api/v1/products/:path*" },
      { source: "/api/v1/products", destination: "http://localhost:3002/api/v1/products" },
      // Order service: orders
      { source: "/api/v1/orders/:path*", destination: "http://localhost:3003/api/v1/orders/:path*" },
      { source: "/api/v1/orders", destination: "http://localhost:3003/api/v1/orders" },
      // Payment service: payments
      { source: "/api/v1/payments/:path*", destination: "http://localhost:3004/api/v1/payments/:path*" },
      { source: "/api/v1/payments", destination: "http://localhost:3004/api/v1/payments" },
    ];
  },
};

export default nextConfig;
