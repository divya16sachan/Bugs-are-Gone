import { UsersDashboard } from "../_components/UsersDashboard";

export const metadata = {
  title: "Users Service | CRUD Dashboard",
  description: "User authentication, profile management, and JWT session inspector.",
};

export default function UsersPage() {
  return <UsersDashboard />;
}
