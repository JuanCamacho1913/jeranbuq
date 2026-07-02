import { prisma } from "@barberia-jeranbuq/database";
import { auth } from "@/backend/lib/auth";
import { DashboardCards } from "@/frontend/components/admin/dashboard-cards";

/**
 * Admin dashboard page — /admin
 *
 * RSC: fetches summary data server-side and passes to client DashboardCards.
 * requireAdmin() is already called in (admin)/layout.tsx.
 */
export default async function AdminDashboardPage() {
  const session = await auth();

  const [activeServicesCount, configuredDays] = await Promise.all([
    prisma.service.count({ where: { active: true } }),
    prisma.adminAvailability.count({ where: { active: true } }),
  ]);

  return (
    <div className="p-6">
      <DashboardCards
        activeServicesCount={activeServicesCount}
        configuredDays={configuredDays}
        userName={session?.user?.name}
      />
    </div>
  );
}
