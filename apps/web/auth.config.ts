import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import type { Role } from "@incident-dash/shared";

const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET ?? "dev-insecure-secret-change-me";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface SyncUserResponse {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
}

async function syncUserWithServer(params: {
  googleSub: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<SyncUserResponse> {
  // Short-lived internal token — proves this call originates from the
  // Auth.js server side, not an end user, since the User row may not exist
  // yet on first sign-in. See apps/server/src/rest/auth.routes.ts.
  const internalToken = jwt.sign({ internal: true }, AUTH_JWT_SECRET, { expiresIn: "1m" });

  const res = await fetch(`${API_URL}/api/v1/auth/sync-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${internalToken}` },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Failed to sync user with backend: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Only re-sync on actual sign-in (account is only present then), not
      // on every token refresh — role changes made by an Admin propagate on
      // the user's next full sign-in / session refresh, not instantly, which
      // is an acceptable prototype tradeoff (see plan's RBAC verification
      // note about token freshness).
      if (account && profile) {
        const googleProfile = profile as { sub: string; picture?: string };
        const synced = await syncUserWithServer({
          googleSub: googleProfile.sub,
          email: profile.email ?? "",
          name: profile.name,
          avatarUrl: googleProfile.picture,
        });

        token.userId = synced.id;
        token.role = synced.role;
        token.email = synced.email;

        // The compact per-user token Express/Socket.IO independently verify
        // with the shared AUTH_JWT_SECRET — see apps/server/src/auth/verifyJwt.ts
        // and apps/server/src/ws/socketServer.ts.
        token.apiToken = jwt.sign(
          { userId: synced.id, email: synced.email, role: synced.role },
          AUTH_JWT_SECRET,
          { expiresIn: "12h" }
        );
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      session.apiToken = token.apiToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
