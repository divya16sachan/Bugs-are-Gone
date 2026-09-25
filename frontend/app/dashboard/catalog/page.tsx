import { CatalogDashboard } from "../_components/CatalogDashboard";

export const metadata = {
  title: "Catalog Service | CRUD Dashboard",
  description: "Product inventory, Redis cache-aside queries, and atomic stock reservation.",
};

export default function CatalogPage() {
  return <CatalogDashboard />;
}
