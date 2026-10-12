// Converts bundled TopoJSON atlases into GameMap JSON files.
// Run: npm run build:maps
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { feature } from 'topojson-client'
import { geoMercator, geoPath, geoAlbersUsa } from 'd3-geo'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'src/data/maps')
mkdirSync(outDir, { recursive: true })

const VIEW = [0, 0, 1000, 650] // fixed svg viewBox for all maps

function loadTopo(pkgRelPath) {
  const p = join(root, 'node_modules', pkgRelPath)
  return JSON.parse(readFileSync(p, 'utf8'))
}

// Middle East / Europe subsets by ISO numeric id.
const EUROPE_IDS = new Set(['250','276','380','724','826','620','528','056','040','752','578','246','208','756','616','203','642','300','348','688','705','191','070','100','440','428','233','372','352','492','020','674','470','807','499','688'])
const MIDDLE_EAST_IDS = new Set(['376','400','422','414','512','634','682','784','887','760','792','368','364','275','048','368'])

function buildFromCountries(topo, filterSet) {
  const fc = feature(topo, topo.objects.countries)
  const feats = filterSet
    ? fc.features.filter((f) => filterSet.has(String(f.id)))
    : fc.features.filter((f) => f.id != null)  // skip features without valid IDs
  const projection = geoMercator().fitExtent(
    [[VIEW[0], VIEW[1]], [VIEW[2], VIEW[3]]],
    { type: 'FeatureCollection', features: feats }
  )
  const path = geoPath(projection)
  const regions = feats.map((f) => {
    const id = String(f.id)
    const d = path(f) || ''
    const b = path.bounds(f) // [[x0,y0],[x1,y1]]
    const c = path.centroid(f)
    return {
      id, nameKey: `region.${id}`,
      svgPath: d,
      bbox: [b[0][0], b[0][1], b[1][0], b[1][1]],
      centroid: [c[0], c[1]],
      _name: f.properties.name,
    }
  }).filter((r) => r.svgPath.length > 0)
  return regions
}

function buildStates(topo) {
  const fc = feature(topo, topo.objects.states)
  const projection = geoAlbersUsa().fitExtent(
    [[VIEW[0], VIEW[1]], [VIEW[2], VIEW[3]]], fc
  )
  const path = geoPath(projection)
  return fc.features.map((f) => {
    const id = String(f.id)
    const d = path(f) || ''
    const b = path.bounds(f)
    const c = path.centroid(f)
    return {
      id, nameKey: `region.us-${id}`, svgPath: d,
      bbox: [b[0][0], b[0][1], b[1][0], b[1][1]],
      centroid: [c[0], c[1]], _name: f.properties.name,
    }
  }).filter((r) => r.svgPath.length > 0)
}

function writeMap(id, nameKey, regions) {
  const names = {}
  const clean = regions.map((r) => {
    names[r.nameKey] = r._name
    const { _name, ...rest } = r
    return rest
  })
  const map = { id, nameKey, viewBox: VIEW, regions: clean }
  writeFileSync(join(outDir, `${id}.json`), JSON.stringify(map))
  return names
}

const world = loadTopo('world-atlas/countries-110m.json')
const us = loadTopo('us-atlas/states-10m.json')

let allNames = {}
allNames = { ...allNames, ...writeMap('world', 'map.world', buildFromCountries(world, null)) }
allNames = { ...allNames, ...writeMap('europe', 'map.europe', buildFromCountries(world, EUROPE_IDS)) }
allNames = { ...allNames, ...writeMap('middle-east', 'map.middle-east', buildFromCountries(world, MIDDLE_EAST_IDS)) }
allNames = { ...allNames, ...writeMap('north-america', 'map.north-america', buildStates(us)) }

// write region English names into i18n/en.json (merge, don't clobber ui keys)
const enPath = join(root, 'src/i18n/en.json')
let en = {}
try { en = JSON.parse(readFileSync(enPath, 'utf8')) } catch {}
en = { ...en, ...allNames }
mkdirSync(dirname(enPath), { recursive: true })
writeFileSync(enPath, JSON.stringify(en, null, 2))
console.log('maps built:', Object.keys(allNames).length, 'region names')
