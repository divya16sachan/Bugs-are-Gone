import type { Metadata } from "next";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your password.",
};

export default function ForgotPasswordPage() {
  // Header lives inside the form since it swaps to a confirmation state.
  return <ForgotPasswordForm />;
}
