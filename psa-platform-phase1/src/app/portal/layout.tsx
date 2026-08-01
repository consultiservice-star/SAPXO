import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (session.user.role !== Role.CLIENT) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 text-sm font-semibold text-slate-500">{session.user.tenantSlug}</div>
        <nav className="space-y-1">
          
            href="/portal/estimates"
            className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Estimates
          </a>
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          {session.user.name} · Client
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
