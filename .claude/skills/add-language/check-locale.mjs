// Compares a locale file against en.json; reports missing keys.
// Usage: node check-locale.mjs src/i18n/en.json src/i18n/he.json
import { readFileSync } from 'node:fs'
const [, , basePath, locPath] = process.argv
const base = JSON.parse(readFileSync(basePath, 'utf8'))
const loc = JSON.parse(readFileSync(locPath, 'utf8'))
const missing = Object.keys(base).filter((k) => !(k in loc))
if (missing.length) {
  console.error(`MISSING ${missing.length} keys in ${locPath}:`)
  console.error(missing.slice(0, 50).join('\n'))
  process.exit(1)
}
console.log(`OK: ${locPath} covers all ${Object.keys(base).length} keys`)
