
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const info = await prisma.$queryRawUnsafe('PRAGMA table_info(SyncJob)');
    console.log(JSON.stringify(info, null, 2));
  } catch (e: any) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
