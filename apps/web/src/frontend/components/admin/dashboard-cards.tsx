"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Scissors, Calendar } from "lucide-react";

interface DashboardCardsProps {
  activeServicesCount: number;
  configuredDays: number;
  userName: string | null | undefined;
}

export function DashboardCards({
  activeServicesCount,
  configuredDays,
  userName,
}: DashboardCardsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Bienvenido{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          Panel de administración — JB Barber Studio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/8 bg-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#A0A0A0]">Servicios Activos</CardTitle>
            <Scissors className="h-4 w-4 text-gold-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-400">{activeServicesCount}</div>
            <p className="text-xs text-[#A0A0A0]">Servicios disponibles para reserva</p>
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-[#1E1E1E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#A0A0A0]">Agenda Semanal</CardTitle>
            <Calendar className="h-4 w-4 text-gold-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-400">{configuredDays} / 7</div>
            <p className="text-xs text-[#A0A0A0]">Días configurados en la agenda</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
