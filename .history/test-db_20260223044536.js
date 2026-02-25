const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  let connectionString = process.env.DATABASE_URL || "";
  console.log("Original:", connectionString);
  if (connectionString.startsWith("prisma+postgres://")) {
    const url = new URL(connectionString);
    const apiKey = url.searchParams.get("api_key") || "";
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
      if (decoded.databaseUrl) {
        connectionString = decoded.databaseUrl;
      }
    }
  }
  console.log("Parsed:", connectionString.replace(/:[^:@]+@/, ':***@'));
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  const count = await prisma.champion.count();
  console.log("Count:", count);
  process.exit(0);
}
main().catch(console.error);
