import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Not permitted") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session.user;
}

export async function requireRole(...allowed: Role[]) {
  const user = await requireSession();
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(`Requires one of: ${allowed.join(", ")}`);
  }
  return user;
}

export async function requireStaff() {
  return requireRole(Role.TENANT_ADMIN, Role.PROJECT_MANAGER, Role.TEAM_USER);
}

export async function requireAdmin() {
  return requireRole(Role.TENANT_ADMIN);
}

export async function requireClientOwnsProject(projectClientId: string) {
  const user = await requireSession();
  if (user.role !== Role.CLIENT) {
    throw new ForbiddenError("Client portal access only");
  }
  if (user.clientId !== projectClientId) {
    throw new ForbiddenError("This project does not belong to your account");
  }
  return user;
}
