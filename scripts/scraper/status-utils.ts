
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateSyncStatus(jobId: string, data: {
  status?: "RUNNING" | "COMPLETED" | "FAILED";
  progress?: number;
  message?: string;
  logs?: string;
}) {
  try {
    const sets = [];
    if (data.status) sets.push(`status = '${data.status}'`);
    if (data.progress !== undefined) sets.push(`progress = ${data.progress}`);
    if (data.message) sets.push(`message = '${data.message.replace(/'/g, "''")}'`);
    if (data.logs) sets.push(`logs = '${data.logs.replace(/'/g, "''")}'`);
    if (data.status === "COMPLETED" || data.status === "FAILED") {
      sets.push(`"endedAt" = NOW()`);
    }

    if (sets.length === 0) return;

    await prisma.$executeRawUnsafe(`
      UPDATE "SyncJob" 
      SET ${sets.join(', ')} 
      WHERE id = '${jobId}'
    `);
  } catch (error) {
    console.error("Failed to update sync status in DB (Raw SQL):", error);
  } finally {
    await prisma.$disconnect();
  }
}
