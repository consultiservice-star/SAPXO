import { requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const user = await requireStaff();

  // Every query filters by tenantId from the session — never from a client param.
  const [activeProjects, openInvoicesAgg, unbilledMinutesAgg] = await Promise.all([
    prisma.project.count({
      where: { tenantId: user.tenantId, status: "ACTIVE" },
    }),
    prisma.invoice.aggregate({
      where: { tenantId: user.tenantId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { totalMinor: true },
    }),
    prisma.timeEntry.aggregate({
      where: { tenantId: user.tenantId, invoiced: false, billable: true },
      _sum: { minutes: true },
    }),
  ]);

  const outstandingMinor = openInvoicesAgg._sum.totalMinor ?? 0;
  const unbilledHours = ((unbilledMinutesAgg._sum.minutes ?? 0) / 60).toFixed(1);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card label="Active projects" value={String(activeProjects)} />
        <Card label="Outstanding invoices" value={formatMoney(outstandingMinor, "USD", user.locale)} />
        <Card label="Unbilled hours" value={unbilledHours} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
