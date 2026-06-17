import Link from "next/link";
import type { Service } from "@barberia-jeranbuq/database";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Clock } from "lucide-react";

function formatCOP(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="group flex flex-col border-white/[0.08] bg-[#1E1E1E] transition-all duration-300 hover:border-gold-500/40 hover:shadow-[0_0_30px_rgba(201,162,39,0.08)]">
      <CardHeader>
        <CardTitle className="font-display text-base text-foreground">
          {service.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {service.description && (
          <p className="line-clamp-2 text-sm text-[#A0A0A0]">
            {service.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-sm text-[#A0A0A0]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{service.durationMin} min</span>
        </div>

        <p className="text-lg font-semibold text-gold-400">
          {formatCOP(service.price)}
        </p>
      </CardContent>

      <CardFooter>
        <Link
          href={`/agendar/${service.id}`}
          className="flex w-full items-center justify-center rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-[#050505] transition-all duration-200 hover:bg-gold-400 hover:shadow-[0_0_20px_rgba(201,162,39,0.2)]"
        >
          Agendar
        </Link>
      </CardFooter>
    </Card>
  );
}
