import Link from "next/link";
import type { Service } from "@barberia-jeranbuq/database";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Clock } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a COP price with Colombian thousand separators.
 * Example: 25000 → "$25.000"
 */
function formatCOP(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

/**
 * Displays a service with its name, description (truncated to 2 lines),
 * duration in minutes, price in COP, and an "Agendar" link button.
 */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{service.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{service.durationMin} min</span>
        </div>

        <p className="text-lg font-semibold">{formatCOP(service.price)}</p>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/agendar/${service.id}`}>Agendar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
