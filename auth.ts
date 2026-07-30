import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DefaultSession } from "@auth/core/types";
import { charityLoginServer } from "@/lib/charity-api-server";
import { getAuthSecret } from "@/lib/auth-config";
import { normalizeLoginPayload, permissionsFromAccessToken, rolesFromAccessToken } from "@/lib/jwt-permissions";
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      roles?: string[];
      permissions?: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    userId?: string;
    roles?: string[];
    permissions?: string[];
  }
  interface User {
    id: string;
    jwt?: string;
    roles?: string[];
    permissions?: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    jwt?: string;
    accessToken?: string;
    roles?: string[];
    permissions?: string[];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Charity API",
      credentials: {
        userName: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) {
          return null;
        }

        try {
          const result = await charityLoginServer({
            userName: String(credentials.userName),
            password: String(credentials.password),
          });

          if (!result.success || !result.data) {
            console.error("[auth] login failed:", result.message, result.errors);
            return null;
          }

          const data = normalizeLoginPayload(result.data as Record<string, unknown>);
          if (!data.token) {
            console.error("[auth] login missing token:", result.message, result.errors);
            return null;
          }

          return {
            id: data.userName || String(credentials.userName),
            name: data.userName || String(credentials.userName),
            email: data.userName || String(credentials.userName),
            jwt: data.token,
            roles: data.roles,
            permissions: data.permissions,
          };
        } catch (error) {
          console.error("[auth] network error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.jwt = user.jwt;
        token.accessToken = user.jwt;
        token.roles = user.roles;
        token.permissions = user.permissions;
      }
      const fromJwt = permissionsFromAccessToken(token.jwt as string | undefined);
      if (fromJwt.length > 0) {
        token.permissions = fromJwt;
      }
      const fromJwtRoles = rolesFromAccessToken(token.jwt as string | undefined);
      if (fromJwtRoles.length > 0) {
        token.roles = fromJwtRoles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const accessToken = token.jwt as string | undefined;
        const fromToken = permissionsFromAccessToken(accessToken);
        const stored = token.permissions as string[] | undefined;
        const permissions = fromToken.length > 0 ? fromToken : stored;
        const rolesFromToken = rolesFromAccessToken(accessToken);
        const storedRoles = token.roles as string[] | undefined;
        const roles = rolesFromToken.length > 0 ? rolesFromToken : storedRoles;

        session.user.id = token.id as string;
        session.user.roles = roles;
        session.user.permissions = permissions;
        session.accessToken = accessToken;
        session.userId = token.id as string;
        session.roles = roles;
        session.permissions = permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  secret: getAuthSecret(),
});