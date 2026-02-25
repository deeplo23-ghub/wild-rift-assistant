import { Client } from 'pg';
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL!.replace('prisma+postgres://', 'postgresql://');
  console.log("Connecting to:", connectionString);
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query('SELECT NOW()');
  console.log("Time:", res.rows[0]);
  await client.end();
}

main().catch(console.error);
