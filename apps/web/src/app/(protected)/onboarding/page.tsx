import { requireAuth } from "@/backend/lib/guards";
import { AuthCard } from "@/frontend/components/auth/auth-card";
import { OnboardingForm } from "@/frontend/components/auth/onboarding-form";

export default async function OnboardingPage() {
  await requireAuth();

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Completar perfil
          </h1>
          <p className="text-sm text-[#A0A0A0]">
            Ingresá tu número de teléfono
          </p>
        </div>

        <OnboardingForm />
      </div>
    </AuthCard>
  );
}
