import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  const url = process.env.DATABASE_URL!;
  const key = url.split("api_key=")[1].split("&")[0];
  const decoded = JSON.parse(Buffer.from(key, "base64").toString());
  console.log("Decoded DB URL:", decoded.databaseUrl);
  
  // Create native Prisma Client pointing to the actual Postgres instance
  const prisma = new PrismaClient({ __internal: { engine: { endpoint: decoded.databaseUrl } } } as any);
  // or better, just override the datasource url:
  const p2 = new PrismaClient({
    datasources: { db: { url: decoded.databaseUrl } }
  });
  
  const count = await p2.champion.count();
  console.log("Champions in DB:", count);
}

main().catch(console.error);
