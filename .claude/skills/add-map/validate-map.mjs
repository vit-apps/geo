// Quality gate for a generated map JSON. Usage: node validate-map.mjs path/to/map.json
import { readFileSync } from 'node:fs'
const file = process.argv[2]
if (!file) { console.error('usage: validate-map.mjs <map.json>'); process.exit(2) }
const map = JSON.parse(readFileSync(file, 'utf8'))
const errors = []
if (!map.id || !map.nameKey || !Array.isArray(map.regions)) errors.push('missing map fields')
if (!Array.isArray(map.viewBox) || map.viewBox.length !== 4) errors.push('bad viewBox')
const seen = new Set()
for (const r of map.regions ?? []) {
  if (!r.id) errors.push('region without id')
  if (seen.has(r.id)) errors.push(`duplicate id ${r.id}`)
  seen.add(r.id)
  if (!r.svgPath || r.svgPath.length === 0) errors.push(`empty path ${r.id}`)
  if (!r.nameKey) errors.push(`missing nameKey ${r.id}`)
  if (!Array.isArray(r.bbox) || r.bbox.length !== 4) errors.push(`bad bbox ${r.id}`)
}
if (errors.length) { console.error('FAIL:\n' + errors.join('\n')); process.exit(1) }
console.log(`OK: ${map.id} ${map.regions.length} regions`)
