
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const last = await prisma.dataMeta.findUnique({ where: { id: "singleton" } });
    console.log("LAST_SCRAPED=" + last?.lastScrapedAt?.toISOString());
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
