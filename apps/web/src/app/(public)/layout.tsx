import { auth } from "@/backend/lib/auth";
import { ClientHeader } from "@/frontend/components/client/client-header";
import { PublicHeader } from "@/frontend/components/public/public-header";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      {session ? <ClientHeader /> : <PublicHeader />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
