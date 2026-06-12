import NextAuth from "next-auth";
import type { NextAuthResult } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { cookies } from "next/headers";
import { prisma } from "@barberia-jeranbuq/database";
import type { PrismaClient } from "@barberia-jeranbuq/database";

// ─── Extracted sign-in logic (testable without NextAuth wiring) ───────────────

type CookieStore = Awaited<ReturnType<typeof cookies>>;

type SignInCallbackParams = {
  userId: string;
  provider: string;
  cookieStore: CookieStore;
  db: Pick<PrismaClient, "user">;
};

/**
 * Core sign-in side-effect: promotes a new user to ADMIN when the
 * `x-auth-intent=ADMIN` cookie is present. First-login wins — an existing
 * ADMIN is never demoted and an existing non-CLIENT is not touched.
 */
export async function handleSignInIntent({
  userId,
  provider,
  cookieStore,
  db,
}: SignInCallbackParams): Promise<void> {
  if (provider !== "google") return;

  const intent = cookieStore.get("x-auth-intent");
  if (intent?.value !== "ADMIN") return;

  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (existing?.role === "CLIENT" || existing === null) {
    await db.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });
  }

  cookieStore.delete("x-auth-intent");
}

// ─── NextAuth instance ────────────────────────────────────────────────────────

const authResult: NextAuthResult = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (user.id && account) {
        const cookieStore = await cookies();
        await handleSignInIntent({
          userId: user.id,
          provider: account.provider,
          cookieStore,
          db: prisma,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;
        token.phone = user.phone ?? null;
        token.onboardingCompletedAt = user.onboardingCompletedAt ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role ?? null;
        session.user.phone = token.phone ?? null;
        session.user.onboardingCompletedAt = token.onboardingCompletedAt ?? null;
      }
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = authResult;
