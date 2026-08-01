import { notFound } from "next/navigation";
import { requireSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { approveEstimate, rejectEstimate } from "../../actions";

export default async function PortalEstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();

  const estimate = await prisma.estimate.findFirst({
    where: {
      id,
      tenantId: user.tenantId,
      status: { not: "DRAFT" },
      project: { clientId: user.clientId },
    },
    include: {
      project: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!estimate) notFound();

  const isPending = estimate.status === "SENT";
  const approveForEstimate = approveEstimate.bind(null, estimate.id);
  const rejectForEstimate = rejectEstimate.bind(null, estimate.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{estimate.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{estimate.project.name}</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {estimate.lineItems.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-right">{item.quantity.toString()}</td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(item.unitPriceMinor, estimate.currency, user.locale)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatMoney(item.amountMinor, estimate.currency, user.locale)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-4 py-3 text-right font-medium">
                Total
              </td>
              <td className="px-4 py-3 text-right text-lg font-semibold">
                {formatMoney(estimate.totalMinor, estimate.currency, user.locale)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {isPending ? (
        <div className="mt-6 flex gap-3">
          <form action={approveForEstimate}>
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Approve
            </button>
          </form>
          <form action={rejectForEstimate}>
            <button
              type="submit"
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Reject
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          This estimate has been {estimate.status.toLowerCase()}.
        </p>
      )}
    </div>
  );
}
