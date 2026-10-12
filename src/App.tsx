import { useEffect, useState } from 'react'
import type { GameMap, ScoreState, ScoringKind } from './engine/types'
import { loadMap, type MapId } from './data/mapIndex'
import { levelsFor, type Level } from './data/levels'
import { loadSettings, saveSettings, mergeSessionMastery } from './engine/persistence'
import { dirFor } from './i18n'
import i18n from 'i18next'
import { Home } from './ui/screens/Home'
import { MapPicker } from './ui/screens/MapPicker'
import { LevelModePicker } from './ui/screens/LevelModePicker'
import { Play } from './ui/screens/Play'
import { Results } from './ui/screens/Results'
import { Stats } from './ui/screens/Stats'

type Screen = 'home' | 'map' | 'level' | 'play' | 'results' | 'stats'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [locale, setLocale] = useState<string>(() => loadSettings().locale)
  const [mapId, setMapId] = useState<MapId | null>(null)
  const [map, setMap] = useState<GameMap | null>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [scoring, setScoring] = useState<ScoringKind>('no-fail')
  const [score, setScore] = useState<ScoreState | null>(null)

  useEffect(() => {
    document.dir = dirFor(locale)
    i18n.changeLanguage(locale)
    saveSettings({ locale, lastMapId: mapId ?? undefined })
  }, [locale, mapId])

  function toggleLocale() { setLocale((l) => (l === 'en' ? 'he' : 'en')) }

  if (screen === 'home')
    return <Home locale={locale} onToggleLocale={toggleLocale}
      onChooseMap={() => setScreen('map')}
      onStats={() => { if (mapId) setScreen('stats') }} />

  if (screen === 'map')
    return <MapPicker onBack={() => setScreen('home')}
      onPick={async (id) => { setMapId(id); setMap(await loadMap(id)); setScreen('level') }} />

  if (screen === 'level' && map && mapId)
    return <LevelModePicker levels={levelsFor(mapId)} onBack={() => setScreen('map')}
      onStart={(lv, sc) => { setLevel(lv); setScoring(sc); setScreen('play') }} />

  if (screen === 'play' && map && level)
    return <Play map={map} level={level} scoring={scoring}
      onExit={(s, sessionMastery) => {
        mergeSessionMastery(map.id, sessionMastery)
        setScore(s); setScreen('results')
      }} />

  if (screen === 'results' && map && level && score)
    return <Results map={map} level={level} score={score} onHome={() => setScreen('home')} />

  if (screen === 'stats' && mapId)
    return <Stats mapId={mapId} onBack={() => setScreen('home')} />

  return <Home locale={locale} onToggleLocale={toggleLocale}
    onChooseMap={() => setScreen('map')} onStats={() => setScreen('home')} />
}
