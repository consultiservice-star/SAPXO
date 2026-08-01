import { requireStaff } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createEstimate } from "../actions";

export default async function NewEstimatePage() {
  const user = await requireStaff();

  const projects = await prisma.project.findMany({
    where: { tenantId: user.tenantId },
    include: { client: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold">New Estimate</h1>

      {projects.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          You need at least one project before creating an estimate.
        </p>
      ) : (
        <form action={createEstimate} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Project</label>
            <select
              name="projectId"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} — {project.client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              name="title"
              required
              placeholder="e.g. Phase 1 — Homepage redesign"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Currency</label>
            <select
              name="currency"
              defaultValue="USD"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create Estimate
          </button>
        </form>
      )}
    </div>
  );
}
