
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateSyncStatus(jobId: string, data: {
  status?: "RUNNING" | "COMPLETED" | "FAILED";
  progress?: number;
  message?: string;
  logs?: string;
}) {
  try {
    const updateData: any = { ...data };
    if (data.status === "COMPLETED" || data.status === "FAILED") {
      updateData.endedAt = new Date();
    }

    await prisma.syncJob.update({
      where: { id: jobId },
      data: updateData,
    });
  } catch (error) {
    console.error("Failed to update sync status in DB:", error);
  } finally {
    await prisma.$disconnect();
  }
}
