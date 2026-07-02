import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@barberia-jeranbuq/shared";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | null;
      phone: string | null;
      onboardingCompletedAt: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole | null;
    phone: string | null;
    onboardingCompletedAt: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role: UserRole | null;
    phone: string | null;
    onboardingCompletedAt: string | null;
  }
}
