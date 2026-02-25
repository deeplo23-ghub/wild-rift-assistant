import { describe, it, expect } from "vitest";
import { scoreChampion } from "./engine";
import { detectStage } from "./stage";
import { getWeights } from "./weights";
import { DraftStage, createEmptyDraftState } from "@/types/draft";
import { Champion, ChampionTag, Role, Tier } from "@/types/champion";

const dummyChamp: Champion = {
  id: "ahri",
  name: "Ahri",
  roles: [Role.Mid],
  winrate: 51.5,
  pickRate: 10,
  banRate: 5,
  tier: Tier.S,
  damageProfile: { ad: 0.1, ap: 0.8, true: 0.1 },
  durabilityScore: 3,
  engageScore: 4,
  peelScore: 4,
  ccScore: 6,
  scalingScore: 6,
  earlyGameScore: 6,
  mobilityScore: 8,
  healingScore: 3,
  shieldScore: 0,
  waveclearScore: 8,
  tags: [ChampionTag.Burst, ChampionTag.Assassin, ChampionTag.Poke],
  iconUrl: "",
};

describe("Scoring Engine Core", () => {
  it("detectStage resolves early/mid/late", () => {
    expect(detectStage(0)).toBe(DraftStage.Early);
    expect(detectStage(2)).toBe(DraftStage.Early);
    expect(detectStage(3)).toBe(DraftStage.Mid);
    expect(detectStage(6)).toBe(DraftStage.Mid);
    expect(detectStage(7)).toBe(DraftStage.Late);
    expect(detectStage(10)).toBe(DraftStage.Late);
  });

  it("getWeights returns normalized weights for Late stage", () => {
    const earlyWt = getWeights(DraftStage.Early);
    const lateWt = getWeights(DraftStage.Late);
    
    // In late stage, composition and counter should have higher weight
    expect(lateWt.composition).toBeGreaterThan(earlyWt.composition);
    expect(lateWt.counter).toBeGreaterThan(earlyWt.counter);
    expect(earlyWt.flexibility).toBeGreaterThan(lateWt.flexibility);
  });

  it("scoreChampion is deterministic", () => {
    const s1 = scoreChampion(dummyChamp, createEmptyDraftState(), [dummyChamp], new Map());
    const s2 = scoreChampion(dummyChamp, createEmptyDraftState(), [dummyChamp], new Map());
    
    expect(s1.finalScore).toBe(s2.finalScore);
    expect(s1.finalScore).toBeGreaterThanOrEqual(0);
    expect(s1.finalScore).toBeLessThanOrEqual(100);
    expect(s1.explanations.length).toBeGreaterThan(0);
  });

  it("handles empty draft (no allies, no enemies, zero counters)", () => {
    // Tests No allies locked, No enemies revealed, Champion with 0 counters
    const emptyDraft = createEmptyDraftState();
    const result = scoreChampion(dummyChamp, emptyDraft, [dummyChamp], new Map());
    expect(result.finalScore).toBeGreaterThan(0);
  });

  it("handles a complex populated draft correctly (boosts component coverage)", () => {
    const draft = createEmptyDraftState();
    draft.ally[Role.Support] = { ...draft.ally[Role.Support], championId: "nami" };
    draft.ally[Role.Dragon] = { ...draft.ally[Role.Dragon], championId: "lucian" };
    draft.enemy[Role.Dragon] = { ...draft.enemy[Role.Dragon], championId: "caitlyn" };
    draft.enemy[Role.Support] = { ...draft.enemy[Role.Support], championId: "lux" };

    const nami: Champion = { ...dummyChamp, id: "nami", roles: [Role.Support], tags: [ChampionTag.Enchanter, ChampionTag.Healing] };
    const lucian: Champion = { ...dummyChamp, id: "lucian", roles: [Role.Dragon], tags: [ChampionTag.Burst, ChampionTag.Marksman] };
    const caitlyn: Champion = { ...dummyChamp, id: "caitlyn", roles: [Role.Dragon], tags: [ChampionTag.Poke, ChampionTag.Marksman] };
    const lux: Champion = { ...dummyChamp, id: "lux", roles: [Role.Support, Role.Mid], tags: [ChampionTag.Poke, ChampionTag.Burst] };

    const cMap = new Map();
    cMap.set(lucian.id, new Map([[caitlyn.id, -2]]));

    const result = scoreChampion(lucian, draft, [nami, lucian], cMap);
    expect(result.finalScore).toBeGreaterThan(0);
    expect(result.breakdown.counter).toBeDefined();
    expect(result.breakdown.threat).toBeDefined();
    expect(result.breakdown.synergy).toBeDefined();
    expect(result.breakdown.composition).toBeDefined();
  });

  it("tests RiskPenalty triggering at 2+ allies (all AD scenario)", () => {
    const draft = createEmptyDraftState();
    // Force 2 allies that are FULL AD
    const adChamp: Champion = { ...dummyChamp, id: "zed", damageProfile: { ad: 1.0, ap: 0, true: 0 } };
    const ally2: Champion = { ...adChamp, id: "yasuo" };
    
    // @ts-ignore - bypassing readonly for test setup
    draft.ally[Role.Mid] = { ...draft.ally[Role.Mid], championId: "zed" };
    // @ts-ignore
    draft.ally[Role.Baron] = { ...draft.ally[Role.Baron], championId: "yasuo" };
    
    // Test third AD candidate
    const candidate: Champion = { ...adChamp, id: "talon" };
    
    const result = scoreChampion(candidate, draft, [adChamp, ally2, candidate], new Map());
    expect(result.breakdown.risk).toBeGreaterThan(0); // Should trigger All AD risk penalty
  });
});
