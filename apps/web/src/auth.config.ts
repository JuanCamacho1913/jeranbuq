import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible NextAuth config — no Prisma, no Node.js-only imports.
 * Used by middleware (Edge runtime) and extended by auth.ts (Node.js runtime).
 */
export const authConfig = {
  providers: [Google],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;
        token.phone = user.phone ?? null;
        token.onboardingCompletedAt = user.onboardingCompletedAt ?? null;
      }
      if (trigger === "update" && session?.user) {
        if (session.user.phone != null) token.phone = session.user.phone;
        if (session.user.onboardingCompletedAt != null) {
          token.onboardingCompletedAt = session.user.onboardingCompletedAt;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role ?? null;
        session.user.phone = token.phone ?? null;
        session.user.onboardingCompletedAt = token.onboardingCompletedAt ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
