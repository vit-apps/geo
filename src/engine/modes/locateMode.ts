import type { GameMap, Prompt, AnswerResult } from '../types'

// LocateMode: the prompt names a region; the player taps a region.
export function makeLocatePrompt(map: GameMap, regionId: string): Prompt {
  const region = map.regions.find((r) => r.id === regionId)
  if (!region) throw new Error(`makeLocatePrompt: regionId "${regionId}" not found in map "${map.id}"`)
  return { regionId, nameKey: region.nameKey }
}

export function judge(expectedRegionId: string, tappedRegionId: string): AnswerResult {
  return {
    correct: expectedRegionId === tappedRegionId,
    expectedRegionId,
    tappedRegionId,
  }
}
