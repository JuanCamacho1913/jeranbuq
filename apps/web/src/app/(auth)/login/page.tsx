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
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Iniciar sesión
        </h1>
        <p className="text-sm text-neutral-500">
          Accedé con tu cuenta de Google
        </p>
      </div>

      <GoogleSignInButton />
    </div>
  );
}
