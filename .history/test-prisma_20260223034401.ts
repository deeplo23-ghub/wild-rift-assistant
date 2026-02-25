import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  try {
    const prisma = new PrismaClient();
    console.log("initialized");
    await prisma.$connect();
    console.log("connected");
    const count = await prisma.champion.count();
    console.log("champion count:", count);
  } catch (err) {
    console.error(err);
  }
}
main();
