import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        tenantSlug: { label: "Company", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.tenantSlug || !credentials?.email || !credentials?.password) {
          return null;
        }

        const tenant = await prisma.tenant.findUnique({
          where: { slug: credentials.tenantSlug },
        });
        if (!tenant) return null;

        const user = await prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: tenant.id,
              email: credentials.email.toLowerCase(),
            },
          },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug,
          role: user.role,
          clientId: user.clientId ?? undefined,
          locale: user.locale,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.tenantId = u.tenantId;
        token.tenantSlug = u.tenantSlug;
        token.role = u.role;
        token.clientId = u.clientId;
        token.locale = u.locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantSlug = token.tenantSlug;
        (session.user as any).role = token.role;
        (session.user as any).clientId = token.clientId;
        (session.user as any).locale = token.locale;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
