
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Checking SyncJob model...");
    const job = await (prisma as any).syncJob.create({
      data: {
        status: "TEST_INITIALIZING",
        progress: 0,
        message: "Testing synchronization connectivity...",
      },
    });
    console.log("Success! Created job ID:", job.id);
  } catch (error: any) {
    console.error("CRITICAL ERROR:", error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
