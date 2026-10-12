export interface RegionMastery {
  box: number
  seen: number
  correct: number
  lastSeenMs: number
}
export type MasteryStore = Record<string, RegionMastery>

export function initMastery(): RegionMastery {
  return { box: 1, seen: 0, correct: 0, lastSeenMs: 0 }
}

export function updateMastery(
  m: RegionMastery, correct: boolean, nowMs: number
): RegionMastery {
  return {
    box: correct ? Math.min(m.box + 1, 5) : 1,
    seen: m.seen + 1,
    correct: m.correct + (correct ? 1 : 0),
    lastSeenMs: nowMs,
  }
}

export function pickNextRegion(
  regionIds: string[], store: MasteryStore, _nowMs: number
): string {
  let best = regionIds[0]
  let bestScore = -Infinity
  for (const id of regionIds) {
    const m = store[id] ?? initMastery()
    // higher score = more due. Never-seen (lastSeen 0) wins hardest.
    const neverSeen = m.lastSeenMs === 0 ? 1 : 0
    // lower box -> more due; older lastSeen -> more due.
    const score = neverSeen * 1e15 + (6 - m.box) * 1e12 + (1e12 - m.lastSeenMs)
    if (score > bestScore) { bestScore = score; best = id }
  }
  return best
}
