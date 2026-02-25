import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  // Decode prisma+postgres URL if needed
  let finalConnString = connectionString;
  if (connectionString.startsWith("prisma+postgres://")) {
    const url = new URL(connectionString);
    const apiKey = url.searchParams.get("api_key") || "";
    if (apiKey) {
      try {
        const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
        if (decoded.databaseUrl) {
          finalConnString = decoded.databaseUrl;
        }
      } catch (e) {}
    }
  }

  const pool = new Pool({ connectionString: finalConnString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("═══════════════════════════════════════════════");
  console.log("  Wild Rift Draft Assistant — Data Integrity Audit");
  console.log("═══════════════════════════════════════════════");

  let issues = 0;

  try {
    // 1) Champion Count
    const champions = await prisma.champion.findMany({ orderBy: { name: 'asc' } });
    console.log(`\n[1] Champion Count`);
    console.log(`  Expected: 135`);
    console.log(`  Actual:   ${champions.length}`);
    if (champions.length !== 135) {
      console.error(`  ❌ ERROR: Expected 135 champions, found ${champions.length}`);
      issues++;
    } else {
      console.log(`  ✅ Success: Exactly 135 champions found.`);
    }

    const names = champions.map(c => c.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      console.error(`  ❌ ERROR: Duplicate champion names detected.`);
      issues++;
    } else {
      console.log(`  ✅ Success: No duplicates found.`);
    }

    console.log(`  List (sorted): ${champions.map(c => c.name).join(", ")}`);

    // 2) Counter Matrix Integrity
    const counters = await prisma.counterMatchup.findMany();
    console.log(`\n[2] Counter Matrix Integrity`);
    console.log(`  Total CounterMatchup rows: ${counters.length}`);
    
    const selfCounters = counters.filter(c => c.championId === c.opponentId);
    if (selfCounters.length > 0) {
      console.error(`  ❌ ERROR: Found ${selfCounters.length} self-counters.`);
      issues++;
    } else {
      console.log(`  ✅ Success: No self-counters found.`);
    }

    const champIds = new Set(champions.map(c => c.id));
    const invalidRefs = counters.filter(c => !champIds.has(c.championId) || !champIds.has(c.opponentId));
    if (invalidRefs.length > 0) {
      console.error(`  ❌ ERROR: Found ${invalidRefs.length} counters referencing invalid champion IDs.`);
      issues++;
    } else {
      console.log(`  ✅ Success: All references are valid.`);
    }

    // Distribution
    const counterCounts = champions.map(c => {
      return counters.filter(m => m.championId === c.id).length;
    });
    const minC = Math.min(...counterCounts);
    const maxC = Math.max(...counterCounts);
    const avgC = counterCounts.reduce((a, b) => a + b, 0) / champions.length;

    console.log(`  Distribution:`);
    console.log(`    • Min counters per champion: ${minC}`);
    console.log(`    • Max counters per champion: ${maxC}`);
    console.log(`    • Avg counters per champion: ${avgC.toFixed(2)}`);

    // 3) Data Sanity Checks
    console.log(`\n[3] Data Sanity Checks`);
    let sanityIssues = 0;
    champions.forEach(c => {
      if (c.winrate < 0 || c.winrate > 100) sanityIssues++;
      if (c.pickRate < 0 || c.pickRate > 100) sanityIssues++;
      if (c.banRate < 0 || c.banRate > 100) sanityIssues++;
      if (c.damageProfileAd < 0 || c.damageProfileAd > 1) sanityIssues++;
      if (c.damageProfileAp < 0 || c.damageProfileAp > 1) sanityIssues++;
      if (c.damageProfileTrue < 0 || c.damageProfileTrue > 1) sanityIssues++;
      if (c.tags.length === 0) sanityIssues++;
      if (!c.id || !c.name || !c.tier || c.roles.length === 0) sanityIssues++;
    });

    if (sanityIssues > 0) {
      console.error(`  ❌ ERROR: Found ${sanityIssues} sanity check failures.`);
      issues += sanityIssues;
    } else {
      console.log(`  ✅ Success: All sanity checks passed.`);
      const winrates = champions.map(c => c.winrate);
      const pickrates = champions.map(c => c.pickRate);
      const banrates = champions.map(c => c.banRate);
      console.log(`    Ranges:`);
      console.log(`      Winrate:  ${Math.min(...winrates).toFixed(2)}% - ${Math.max(...winrates).toFixed(2)}%`);
      console.log(`      Pickrate: ${Math.min(...pickrates).toFixed(2)}% - ${Math.max(...pickrates).toFixed(2)}%`);
      console.log(`      Banrate:  ${Math.min(...banrates).toFixed(2)}% - ${Math.max(...banrates).toFixed(2)}%`);
    }

    // 4) DataMeta Verification
    const meta = await prisma.dataMeta.findUnique({ where: { id: 'singleton' } });
    console.log(`\n[4] DataMeta Verification`);
    if (!meta) {
      console.error(`  ❌ ERROR: DataMeta singleton missing.`);
      issues++;
    } else {
      console.log(`  • championCount: ${meta.championCount}`);
      if (meta.championCount !== 135) {
        console.error(`  ❌ ERROR: meta.championCount (${meta.championCount}) !== 135`);
        issues++;
      }
      console.log(`  • lastScrapedAt: ${meta.lastScrapedAt}`);
      if (!meta.lastScrapedAt) {
        console.error(`  ❌ ERROR: meta.lastScrapedAt is empty.`);
        issues++;
      }
      console.log(`  • version:       ${meta.version}`);
      console.log(`  ✅ Success: DataMeta looks good.`);
    }

    // 5) Summary Report
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`  AUDIT SUMMARY`);
    console.log(`═══════════════════════════════════════════════`);
    console.log(`  Champions:       ${champions.length}`);
    console.log(`  Counters:        ${counters.length}`);
    console.log(`  Integrity Issues: ${issues}`);
    console.log(`═══════════════════════════════════════════════`);

    if (issues > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error(`\nFATAL ERROR during audit:`, err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
