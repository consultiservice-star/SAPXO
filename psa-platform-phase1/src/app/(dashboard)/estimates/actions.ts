"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/access";
import { toMinorUnits, sumLineItems } from "@/lib/money";

export async function createEstimate(formData: FormData) {
  const user = await requireStaff();

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const currency = (formData.get("currency") as string) || "USD";

  if (!projectId || !title) {
    throw new Error("Project and title are required");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: user.tenantId },
  });
  if (!project) throw new Error("Project not found");

  const estimate = await prisma.estimate.create({
    data: {
      tenantId: user.tenantId,
      projectId,
      title,
      currency,
      status: "DRAFT",
      totalMinor: 0,
    },
  });

  revalidatePath("/dashboard/estimates");
  redirect(`/dashboard/estimates/${estimate.id}`);
}

export async function addLineItem(estimateId: string, formData: FormData) {
  const user = await requireStaff();

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId: user.tenantId },
  });
  if (!estimate) throw new Error("Estimate not found");
  if (estimate.status !== "DRAFT") {
    throw new Error("Cannot edit an estimate that has already been sent");
  }

  const description = formData.get("description") as string;
  const quantity = parseFloat(formData.get("quantity") as string);
  const unitPrice = parseFloat(formData.get("unitPrice") as string);

  if (!description || isNaN(quantity) || isNaN(unitPrice)) {
    throw new Error("Description, quantity, and unit price are required");
  }

  const unitPriceMinor = toMinorUnits(unitPrice);
  const amountMinor = Math.round(quantity * unitPriceMinor);

  await prisma.$transaction(async (tx) => {
    await tx.estimateLineItem.create({
      data: {
        estimateId,
        description,
        quantity,
        unitPriceMinor,
        amountMinor,
      },
    });

    const allItems = await tx.estimateLineItem.findMany({
      where: { estimateId },
    });
    const newTotal = sumLineItems(allItems);

    await tx.estimate.update({
      where: { id: estimateId },
      data: { totalMinor: newTotal },
    });
  });

  revalidatePath(`/dashboard/estimates/${estimateId}`);
}

export async function removeLineItem(estimateId: string, lineItemId: string) {
  const user = await requireStaff();

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId: user.tenantId },
  });
  if (!estimate) throw new Error("Estimate not found");
  if (estimate.status !== "DRAFT") {
    throw new Error("Cannot edit an estimate that has already been sent");
  }

  await prisma.$transaction(async (tx) => {
    await tx.estimateLineItem.delete({
      where: { id: lineItemId, estimateId },
    });

    const remaining = await tx.estimateLineItem.findMany({
      where: { estimateId },
    });
    const newTotal = sumLineItems(remaining);

    await tx.estimate.update({
      where: { id: estimateId },
      data: { totalMinor: newTotal },
    });
  });

  revalidatePath(`/dashboard/estimates/${estimateId}`);
}

export async function sendEstimate(estimateId: string) {
  const user = await requireStaff();

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId: user.tenantId },
    include: { lineItems: true },
  });
  if (!estimate) throw new Error("Estimate not found");
  if (estimate.lineItems.length === 0) {
    throw new Error("Add at least one line item before sending");
  }

  await prisma.estimate.update({
    where: { id: estimateId },
    data: { status: "SENT" },
  });

  revalidatePath(`/dashboard/estimates/${estimateId}`);
  revalidatePath("/dashboard/estimates");
}

export async function deleteEstimate(estimateId: string) {
  const user = await requireStaff();

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId: user.tenantId },
  });
  if (!estimate) throw new Error("Estimate not found");

  await prisma.estimate.delete({ where: { id: estimateId } });

  revalidatePath("/dashboard/estimates");
  redirect("/dashboard/estimates");
}
