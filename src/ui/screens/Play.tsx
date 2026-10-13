import { useMemo, useRef, useState } from 'react'
import type { GameMap, ScoringKind, Prompt, ScoreState } from '../../engine/types'
import type { MasteryStore } from '../../engine/scheduler'
import type { Level } from '../../data/levels'
import { createSession, type Session } from '../../engine/session'
import { MapRenderer, type RegionVisual } from '../MapRenderer'
import { PromptBanner } from '../hud/PromptBanner'
import { ScoreHud } from '../hud/ScoreHud'

export interface PlayProps {
  map: GameMap
  level: Level
  scoring: ScoringKind
  onExit: (score: ScoreState, mastery: MasteryStore) => void
}

export function Play({ map, level, scoring, onExit }: PlayProps) {
  const regionIds = useMemo(() => level.regionIds(map), [map, level])
  const sessionRef = useRef<Session | null>(null)
  if (sessionRef.current === null) {
    sessionRef.current = createSession({
      map, regionIds, scoring, livesStart: scoring === 'lives' ? 3 : undefined,
    })
  }
  const session = sessionRef.current
  const processingRef = useRef(false)
  const [prompt, setPrompt] = useState<Prompt | null>(() => session.nextPrompt())
  const [visuals, setVisuals] = useState<Record<string, RegionVisual>>({})
  const [score, setScore] = useState<ScoreState>(() => session.score())

  function handleTap(regionId: string) {
    if (processingRef.current || !prompt) return
    processingRef.current = true
    const result = session.submitAnswer(regionId)
    const next: Record<string, RegionVisual> = {}
    if (result.correct) next[regionId] = 'correct'
    else { next[regionId] = 'wrong'; next[result.expectedRegionId] = 'revealed' }
    setVisuals(next)
    setScore(session.score())
    setTimeout(() => {
      processingRef.current = false
      setVisuals({})
      if (session.isComplete()) { onExit(session.score(), session.mastery()); return }
      setPrompt(session.nextPrompt())
    }, 650)
  }

  return (
    <div className="play-screen">
      {prompt && <PromptBanner nameKey={prompt.nameKey} regionId={prompt.regionId} />}
      <ScoreHud score={score} />
      <div className="map-wrap">
        <MapRenderer map={map} visuals={visuals} activeIds={regionIds} onRegionTap={handleTap} />
      </div>
    </div>
  )
}
