# GeoMap Game

A geography-learning PWA for mastering world and regional maps through adaptive, game-based repetition. Learn by locating and naming regions on empty or partially empty maps, with difficulty levels and multiple scoring modes.

## What is this app?

GeoMap is a client-only, offline-capable PWA that teaches geography through interactive games. Players select a map and difficulty level, then play through carefully adapted drills that focus on regions they haven't yet mastered. The app uses spaced-repetition scheduling and adaptive difficulty to help learners from first-graders through experts progress to fluency.

**Key features:**
- Installable as a PWA; works offline after first load
- Four preloaded maps: World, Europe, Middle East, North America + US states
- Three scoring modes: no-fail learning, lives, timer/best time
- Adaptive spaced-repetition scheduler
- Difficulty levels (beginner → expert)
- Full internationalization: English + Hebrew with RTL support
- Built on React + Vite + TypeScript

## Running locally

### Development

```bash
npm run dev
```

Starts a hot-reload dev server. Open `http://localhost:5173` in your browser.

### Testing

```bash
npm test
```

Runs the full test suite (Vitest). For watch mode:

```bash
npm test:watch
```

### Building

```bash
npm run build
```

Builds the production-optimized bundle to `dist/`.

### Generating map data

The map data (TopoJSON and region boundaries) is pre-built. To rebuild maps from source atlases:

```bash
npm run build:maps
```

*Note: This script is called during build tasks in later development phases.*

## Deploying

The app is designed to be deployed on GitHub Pages. The build process uses a `BASE_PATH` environment variable (set by CI) to configure the deployment URL correctly.

```bash
BASE_PATH=/geo-game npm run build
```

The GitHub Pages deployment happens automatically via CI/CD in a later task.

## Architecture

The app is split into two halves:

### The shipped app (React + Vite + TypeScript)

**Engine layer** — a pure, framework-agnostic TypeScript engine that holds all game logic: modes, scoring strategies, and the adaptive spaced-repetition scheduler. It's DOM-free and fully unit-tested.

**UI layer** — React components that render engine state, handle user input, and manage internationalization (i18n) + right-to-left (RTL) layout. It holds no game logic, only presentation.

**Data layer** — bundled TopoJSON and per-map region data. Each region is `{ id, nameKey, svgPath, centroid, bbox, capital? }`.

**Persistence** — browser local storage for per-region mastery, best times, and settings (language, mode, difficulty).

### The development layer (in-repo Claude skills)

Under `.claude/skills/`, expansion tasks are orchestrated via markdown workflows and helper scripts. Each skill runs four stages: **acquire → generate → test → quality gate**, and records non-trivial choices as an ADR.

**Adopted rule:** maps, regions, game modes, and languages are added *only* via the skills in `.claude/skills/`:
- `add-map` — add a new map from open-source boundaries
- `add-region` — add or correct individual regions in an existing map
- `add-game-mode` — scaffold a new engine mode against the mode interface
- `add-language` — add a UI + region-name locale from open sources

This ensures acquisition, code generation, testing, and quality gates always run. See [ADR 0007](docs/adr/0007-skill-driven-development.md) for the skill-driven-development rule.

## Documentation

- **Specification** — [docs/superpowers/specs/2026-10-12-geo-map-game-design.md](docs/superpowers/specs/2026-10-12-geo-map-game-design.md)
- **Architecture Decision Records** — [docs/adr/](docs/adr/) directory
  - Each ADR documents a significant decision and its rationale
  - [ADR 0001: Frontend stack](docs/adr/0001-frontend-stack.md)
  - [ADR 0002: Client-only PWA on GitHub Pages](docs/adr/0002-client-only-pwa-github-pages.md)
  - [ADR 0003: SVG outline maps](docs/adr/0003-svg-outline-maps.md)
  - [ADR 0004: Difficulty via adaptive repetition](docs/adr/0004-difficulty-adaptive-repetition.md)
  - [ADR 0005: Engine/UI separation](docs/adr/0005-engine-ui-separation.md)
  - [ADR 0006: Internationalization and RTL](docs/adr/0006-i18n-rtl.md)
  - [ADR 0007: Skill-driven development](docs/adr/0007-skill-driven-development.md)
  - [ADR 0008: Open map data sources](docs/adr/0008-open-map-data-sources.md)
  - [ADR 0009: Verification and evidence](docs/adr/0009-verification-evidence.md)

## Project structure

```
.
├── src/                 # React app
│   ├── engine/          # Pure game engine (no DOM)
│   ├── ui/              # React components
│   ├── i18n/            # Internationalization
│   └── App.tsx          # Root component
├── docs/
│   ├── adr/             # Architecture Decision Records
│   └── superpowers/     # Task planning and specs
├── .claude/
│   ├── skills/          # Development-layer skills
│   └── settings.json    # Claude Code configuration
├── scripts/             # Build helpers
├── public/              # Static assets (manifest.json, icons)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Contributing

Follow the adopted development rules:
- Run tests (`npm test`) before committing changes
- Add maps, regions, modes, and languages *only* via the skills in `.claude/skills/`
- Document decisions as ADRs in `docs/adr/`
- See [ADR 0007](docs/adr/0007-skill-driven-development.md) for the skill-driven-development rule

## License

[To be determined]
