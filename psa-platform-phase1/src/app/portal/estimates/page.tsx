import Link from "next/link";
import { requireSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function PortalEstimatesPage() {
  const user = await requireSession();

  const estimates = await prisma.estimate.findMany({
    where: {
      tenantId: user.tenantId,
      status: { not: "DRAFT" },
      project: { clientId: user.clientId },
    },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Estimates</h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {estimates.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No estimates to review yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => (
                <tr key={estimate.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/estimates/${estimate.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {estimate.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{estimate.project.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[estimate.status]}`}
                    >
                      {estimate.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(estimate.totalMinor, estimate.currency, user.locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
