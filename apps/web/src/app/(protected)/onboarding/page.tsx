import { requireAuth } from "@/backend/lib/guards";
import { OnboardingForm } from "@/frontend/components/auth/onboarding-form";

export default async function OnboardingPage() {
  await requireAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Completar perfil
            </h1>
            <p className="text-sm text-neutral-500">
              Ingresá tu número de teléfono
            </p>
          </div>

          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
