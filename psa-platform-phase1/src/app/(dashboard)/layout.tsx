import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

const NAV_ITEMS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: [Role.TENANT_ADMIN, Role.PROJECT_MANAGER, Role.TEAM_USER] },
  { href: "/dashboard/projects", label: "Projects", roles: [Role.TENANT_ADMIN, Role.PROJECT_MANAGER, Role.TEAM_USER] },
  { href: "/dashboard/estimates", label: "Estimates", roles: [Role.TENANT_ADMIN, Role.PROJECT_MANAGER] },
  { href: "/dashboard/time", label: "Time Tracking", roles: [Role.TENANT_ADMIN, Role.PROJECT_MANAGER, Role.TEAM_USER] },
  { href: "/dashboard/invoices", label: "Invoices", roles: [Role.TENANT_ADMIN, Role.PROJECT_MANAGER] },
  { href: "/dashboard/expenses", label: "Expenses", roles: [Role.TENANT_ADMIN, Role.PROJECT_MANAGER, Role.TEAM_USER] },
  { href: "/settings", label: "Settings", roles: [Role.TENANT_ADMIN] },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Clients get the portal, not the staff dashboard.
  if (session.user.role === Role.CLIENT) redirect("/portal");

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(session.user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 text-sm font-semibold text-slate-500">{session.user.tenantSlug}</div>
        <nav className="space-y-1">
          {visibleNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          {session.user.name} · {session.user.role.replace("_", " ")}
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
