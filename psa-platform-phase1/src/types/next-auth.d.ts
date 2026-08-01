import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      tenantSlug: string;
      role: Role;
      clientId?: string;
      locale: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string;
    tenantSlug: string;
    role: Role;
    clientId?: string;
    locale: string;
  }
}
