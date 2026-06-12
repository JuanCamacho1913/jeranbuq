import { redirect } from "next/navigation";
import { BarberCodeForm } from "@/frontend/components/auth/barber-code-form";

export default function BarberLoginPage() {
  if (!process.env.BARBER_SECRET_CODE) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Acceso Barbero
        </h1>
        <p className="text-sm text-neutral-500">
          Ingresá el código de acceso para continuar
        </p>
      </div>

      <BarberCodeForm />
    </div>
  );
}
