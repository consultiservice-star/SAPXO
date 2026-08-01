"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, ForbiddenError } from "@/lib/access";
import { Role } from "@prisma/client";

async function getOwnedEstimateOrThrow(estimateId: string) {
  const user = await requireSession();
  if (user.role !== Role.CLIENT) {
    throw new ForbiddenError("Client portal access only");
  }

  const estimate = await prisma.estimate.findFirst({
    where: { id: estimateId, tenantId: user.tenantId },
    include: { project: true },
  });

  if (!estimate || estimate.project.clientId !== user.clientId) {
    throw new ForbiddenError("Estimate not found");
  }

  return estimate;
}

export async function approveEstimate(estimateId: string) {
  const estimate = await getOwnedEstimateOrThrow(estimateId);

  if (estimate.status !== "SENT") {
    throw new Error("This estimate is not awaiting approval");
  }

  await prisma.estimate.update({
    where: { id: estimateId },
    data: { status: "APPROVED" },
  });

  revalidatePath(`/portal/estimates/${estimateId}`);
  revalidatePath("/portal/estimates");
}

export async function rejectEstimate(estimateId: string) {
  const estimate = await getOwnedEstimateOrThrow(estimateId);

  if (estimate.status !== "SENT") {
    throw new Error("This estimate is not awaiting approval");
  }

  await prisma.estimate.update({
    where: { id: estimateId },
    data: { status: "REJECTED" },
  });

  revalidatePath(`/portal/estimates/${estimateId}`);
  revalidatePath("/portal/estimates");
}
