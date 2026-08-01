import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-agency" },
    update: {},
    create: {
      name: "Demo Agency",
      slug: "demo-agency",
      defaultLocale: "en",
      defaultCurrency: "USD",
    },
  });

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      passwordHash,
      name: "Alex Admin",
      role: Role.TENANT_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "pm@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "pm@demo.com",
      passwordHash,
      name: "Priya Manager",
      role: Role.PROJECT_MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "team@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "team@demo.com",
      passwordHash,
      name: "Sam TeamUser",
      role: Role.TEAM_USER,
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      tenantId: tenant.id,
      name: "Jordan Client",
      company: "Acme Co",
      email: "jordan@acme.com",
      currency: "USD",
    },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "client@acme.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "client@acme.com",
      passwordHash,
      name: "Jordan Client",
      role: Role.CLIENT,
      clientId: client.id,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      tenantId: tenant.id,
      clientId: client.id,
      name: "Website Redesign",
      description: "Full redesign of the Acme marketing site",
      status: "ACTIVE",
      currency: "USD",
      managerId: admin.id,
    },
  });

  console.log("Seeded demo tenant:", tenant.slug);
  console.log("Logins (password: Password123!):");
  console.log("  admin@demo.com (Tenant Admin)");
  console.log("  pm@demo.com (Project Manager)");
  console.log("  team@demo.com (Team User)");
  console.log("  client@acme.com (Client Portal)");
  console.log("Project:", project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
