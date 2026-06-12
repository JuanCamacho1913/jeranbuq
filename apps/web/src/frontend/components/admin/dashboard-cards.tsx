"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Scissors, Calendar } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardCardsProps {
  activeServicesCount: number;
  configuredDays: number;
  userName: string | null | undefined;
}

// ─── DashboardCards ───────────────────────────────────────────────────────────

/**
 * Summary cards for the admin dashboard.
 * Receives pre-fetched data from the RSC parent.
 */
export function DashboardCards({
  activeServicesCount,
  configuredDays,
  userName,
}: DashboardCardsProps) {
  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Admin panel — Barbería Jeranbuq
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active services count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeServicesCount}</div>
            <p className="text-xs text-muted-foreground">Services available for booking</p>
          </CardContent>
        </Card>

        {/* Schedule status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configuredDays} / 7</div>
            <p className="text-xs text-muted-foreground">Days configured in weekly schedule</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
