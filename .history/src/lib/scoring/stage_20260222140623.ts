/**
 * Stage detection — determines draft stage from total picks.
 *
 * See: .gsd/ARCHITECTURE.md §4.3 and §6.
 *
 * Stage transitions:
 *   EARLY  = totalPicks ∈ [0, 2]
 *   MID    = totalPicks ∈ [3, 6]
 *   LATE   = totalPicks ∈ [7, 10]
 */

import { DraftStage } from "@/types/draft";

/**
 * Detect the current draft stage based on total known picks.
 *
 * @param totalPicks - Sum of ally picks + known enemy picks (0–10)
 * @returns The current DraftStage
 */
export function detectStage(totalPicks: number): DraftStage {
  if (totalPicks <= 2) return DraftStage.Early;
  if (totalPicks <= 6) return DraftStage.Mid;
  return DraftStage.Late;
}
