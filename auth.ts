import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { accounts, sessions, userPreferences, userProgress, users, verificationTokens } from "@/db/schema";
import { isGoogleSsoEnabled } from "@/features/auth/config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  pages: { signIn: "/sign-in" },
  providers: [
    Google({
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      if (!isGoogleSsoEnabled()) return true;
      const path = request.nextUrl.pathname;
      if (path === "/sign-in" || path.startsWith("/api/auth")) return true;
      return Boolean(session?.user);
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const userId = user.id;
      if (!userId) return;
      await db.transaction(async (tx) => {
        await tx.insert(userPreferences).values({ userId }).onConflictDoNothing();
        await tx.insert(userProgress).values({ userId }).onConflictDoNothing();
      });
    },
  },
});
