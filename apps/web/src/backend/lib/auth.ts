import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@barberia-jeranbuq/database";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error — extended User fields from Prisma schema
        token.role = user.role ?? null;
        // @ts-expect-error — extended User fields from Prisma schema
        token.phone = user.phone ?? null;
        // @ts-expect-error — extended User fields from Prisma schema
        token.onboardingCompletedAt = user.onboardingCompletedAt ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-expect-error — extended session user fields
        session.user.role = token.role ?? null;
        // @ts-expect-error — extended session user fields
        session.user.phone = token.phone ?? null;
        // @ts-expect-error — extended session user fields
        session.user.onboardingCompletedAt = token.onboardingCompletedAt ?? null;
      }
      return session;
    },
  },
});
