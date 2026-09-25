import { OrdersDashboard } from "../_components/OrdersDashboard";

export const metadata = {
  title: "Orders Service | CRUD Dashboard",
  description: "Order processing, multi-item checkout, and lifecycle state transitions.",
};

export default function OrdersPage() {
  return <OrdersDashboard />;
}
