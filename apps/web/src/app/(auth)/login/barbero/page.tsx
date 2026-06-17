import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { BarberCodeForm } from "@/frontend/components/auth/barber-code-form";

export default async function BarberLoginPage() {
  const session = await auth();
  if (session) {
    redirect("/");
  }

  if (!process.env.BARBER_SECRET_CODE) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Acceso Barbero
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          Ingresá el código de acceso para continuar
        </p>
      </div>

      <BarberCodeForm />
    </div>
  );
}
