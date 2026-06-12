import { AuthCard } from "@/frontend/components/auth/auth-card";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCard>{children}</AuthCard>;
}
