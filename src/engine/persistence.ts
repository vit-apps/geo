import { initMastery, updateMastery, type MasteryStore } from './scheduler'

let storage: Storage =
  typeof localStorage !== 'undefined' ? localStorage : (undefined as unknown as Storage)

export function __setStorage(s: Storage) { storage = s }

export interface SettingsState { locale: string; lastMapId?: string }

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadMastery(mapId: string): MasteryStore {
  return readJSON<MasteryStore>(`geo:mastery:${mapId}`, {})
}
export function saveMastery(mapId: string, store: MasteryStore): void {
  storage.setItem(`geo:mastery:${mapId}`, JSON.stringify(store))
}
export function mergeSessionMastery(mapId: string, session: MasteryStore): MasteryStore {
  const base = loadMastery(mapId)
  for (const [id, sm] of Object.entries(session)) {
    const cur = base[id] ?? initMastery()
    // fold session's seen/correct into stored history, keep best box.
    base[id] = {
      box: Math.max(cur.box, sm.box),
      seen: cur.seen + sm.seen,
      correct: cur.correct + sm.correct,
      lastSeenMs: Math.max(cur.lastSeenMs, sm.lastSeenMs),
    }
  }
  saveMastery(mapId, base)
  return base
}
export function loadBestMs(mapId: string, levelId: string): number | undefined {
  return readJSON<number | undefined>(`geo:best:${mapId}:${levelId}`, undefined)
}
export function saveBestMs(mapId: string, levelId: string, ms: number): void {
  const cur = loadBestMs(mapId, levelId)
  if (cur === undefined || ms < cur) {
    storage.setItem(`geo:best:${mapId}:${levelId}`, JSON.stringify(ms))
  }
}
export function loadSettings(): SettingsState {
  return readJSON<SettingsState>('geo:settings', { locale: 'en' })
}
export function saveSettings(s: SettingsState): void {
  storage.setItem('geo:settings', JSON.stringify(s))
}

// re-export so callers get the type without importing scheduler directly
export type { MasteryStore }
export { updateMastery }
