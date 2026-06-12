import { requireAuth } from "@/backend/lib/guards";
import { AuthCard } from "@/frontend/components/auth/auth-card";
import { OnboardingForm } from "@/frontend/components/auth/onboarding-form";

export default async function OnboardingPage() {
  await requireAuth();

  return (
    <AuthCard>
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
    </AuthCard>
  );
}
