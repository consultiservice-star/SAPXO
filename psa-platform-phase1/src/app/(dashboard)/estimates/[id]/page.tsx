import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { addLineItem, removeLineItem, sendEstimate, deleteEstimate } from "../actions";

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff();

  const estimate = await prisma.estimate.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      project: { include: { client: true } },
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!estimate) notFound();

  const isDraft = estimate.status === "DRAFT";
  const addLineItemForEstimate = addLineItem.bind(null, estimate.id);
  const sendForEstimate = sendEstimate.bind(null, estimate.id);
  const deleteForEstimate = deleteEstimate.bind(null, estimate.id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{estimate.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {estimate.project.name} — {estimate.project.client.name}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {estimate.status}
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Unit Price</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              {isDraft && <th className="px-4 py-3"></th>}
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
                {isDraft && (
                  <td className="px-4 py-3 text-right">
                    <form action={removeLineItem.bind(null, estimate.id, item.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  </td>
                )}
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
              {isDraft && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {isDraft && (
        <>
          <form
            action={addLineItemForEstimate}
            className="mt-6 grid grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <input
              name="description"
              placeholder="Description"
              required
              className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="quantity"
              type="number"
              step="0.01"
              placeholder="Qty"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="unitPrice"
              type="number"
              step="0.01"
              placeholder="Unit price"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="col-span-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add line item
            </button>
          </form>

          <div className="mt-6 flex gap-3">
            <form action={sendForEstimate}>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Send to client
              </button>
            </form>
            <form action={deleteForEstimate}>
              <button
                type="submit"
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete estimate
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
