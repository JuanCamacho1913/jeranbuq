import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { GoogleSignInButton } from "@/frontend/components/auth/google-sign-in-button";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Iniciar sesión
        </h1>
        <p className="text-sm text-[#A0A0A0]">
          Accedé con tu cuenta de Google
        </p>
      </div>

      <GoogleSignInButton />
    </div>
  );
}
