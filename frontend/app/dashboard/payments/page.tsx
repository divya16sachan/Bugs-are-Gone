import { PaymentsDashboard } from "../_components/PaymentsDashboard";

export const metadata = {
  title: "Payments Service | CRUD Dashboard",
  description: "Synchronous payment processor, RabbitMQ async pipeline, and transaction log.",
};

export default function PaymentsPage() {
  return <PaymentsDashboard />;
}
