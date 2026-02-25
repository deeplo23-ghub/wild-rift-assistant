import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { scoreAllChampions } from "../src/lib/scoring/engine";
import { createEmptyDraftState } from "../src/types/draft";
import { Role } from "../src/types/champion";
import 'dotenv/config';

async function main() {
  const connectionString = (process.env.DATABASE_URL || "").replace("prisma+postgres://", "postgres://");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Loading data from database...");
  const rawChampions = await prisma.champion.findMany();

  const rawCounters = await prisma.counterMatchup.findMany();

  // Convert raw to domain Champion[]
  const allChampions = rawChampions.map(c => ({
    id: c.id,
    name: c.name,
    roles: c.roles.map(r => r as Role),
    winrate: Number(c.winrate),
    pickRate: Number(c.pickRate),
    banRate: Number(c.banRate),
    tier: c.tier as any,
    damageProfile: {
      ad: Number(c.damageProfileAd),
      ap: Number(c.damageProfileAp),
      true: Number(c.damageProfileTrue),
    },
    durabilityScore: c.durabilityScore,
    engageScore: c.engageScore,
    peelScore: c.peelScore,
    ccScore: c.ccScore,
    scalingScore: c.scalingScore,
    earlyGameScore: c.earlyGameScore,
    mobilityScore: c.mobilityScore,
    healingScore: c.healingScore,
    shieldScore: c.shieldScore,
    waveclearScore: c.waveclearScore,
    tags: c.tags.map(t => t as any),
    iconUrl: c.iconUrl || "",
  }));

  const counterMatrix = new Map();
  for (const match of rawCounters) {
    if (!counterMatrix.has(match.championId)) {
      counterMatrix.set(match.championId, new Map());
    }
    counterMatrix.get(match.championId).set(match.opponentId, match.scoreValue);
  }

  // Setup mock draft
  const draftState = createEmptyDraftState();
  draftState.ally[Role.Baron].championId = "garen";
  draftState.ally[Role.Mid].championId = "ahri";
  draftState.enemy[Role.Jungle].championId = "lee-sin";
  draftState.enemy[Role.Baron].championId = "darius";

  console.log("\nMock Draft State:");
  console.log("- Allies: Garen (Baron), Ahri (Mid)");
  console.log("- Enemies: Lee Sin (Jungle), Darius (Baron)");
  console.log("---------------------------------------");

  console.time("Scoring Time");
  const scored = scoreAllChampions(allChampions, draftState, counterMatrix);
  console.timeEnd("Scoring Time");

  console.log("\nTop 5 Candidates:");
  for (const sc of scored.slice(0, 5)) {
    console.log(`\n1. [${sc.finalScore.toFixed(1)}] ${sc.championId}`);
    console.log(`   Reasons:`);
    sc.explanations.forEach(e => console.log(`     * ${e}`));
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
