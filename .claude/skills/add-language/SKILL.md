---
name: add-language
description: Use this skill when asked to add a language, add a new locale, add translations, support a new language in the geo-game, or translate the app. Triggers on phrases like "add [language] support", "add a locale", "translate to [language]", "support [language]", "add RTL language".
---

# Skill: add-language

Add a new locale to the geo-game. A locale provides translated UI strings and, where available, region names. This skill documents the four stages required for any language expansion.

**Key rule:** Never invent region names. If a region-name translation is not available from an open, verifiable source, **flag the gap for human review** and let the runtime fall back to English. See Stage 1 for details.

---

## Stage 1 — Acquire Translations

### 1a. UI strings

The 23 UI keys in `src/i18n/en.json` (all keys that do **not** start with `region.`) must be fully translated before shipping the locale. Sources:

- **Human translator** — preferred for accuracy and tone.
- **Machine translation** (e.g. DeepL, Google Translate) — acceptable for an initial draft; mark the PR description with "MT: needs native review".
- Never leave a UI key untranslated: the `parseMissingKeyHandler` in `src/i18n/index.ts` will render the raw key, which looks broken to users.

### 1b. Region names (optional but encouraged)

Region names live under keys `region.<ISO-or-FIPS-id>` (e.g. `region.276` for Germany). The runtime uses `fallbackLng: 'en'` so a missing region key silently falls back to the English name — **that is acceptable and expected** for many locales.

When acquiring region-name translations, use open, stable, verifiable sources:

- **Wikidata** — fetch label for each region's ISO/FIPS id via the SPARQL endpoint or a Wikidata item lookup. The stable id in the JSON is the same numeric id used in `region.*` keys.
  ```
  https://www.wikidata.org/wiki/Special:EntityData/Q183.json  (Germany = Q183)
  ```
- **Unicode CLDR** — `cldr-localenames-full` npm package contains region names in ~600 locales keyed by ISO 3166-1 alpha-2.
- **GeoNames** — country/region names in many languages.

**Gap policy — CRITICAL:**
- If a region name is not found in the source, do **not** invent or guess the name.
- Instead, **omit the key entirely** from the locale JSON. The English fallback will be used at runtime.
- In the PR description, list all missing region names as a "TODO: needs native translation" section.
- Flag any region whose Wikidata label differs significantly from the English name (e.g. endonyms vs. exonyms) for human confirmation.

### 1c. RTL check

If the language is right-to-left (Arabic, Hebrew, Persian, Urdu, …), note this — you must set `dirFor` in Stage 2.

---

## Stage 2 — Generate

### 2a. Create the locale file

Create `src/i18n/<locale>.json`. Use the BCP 47 language tag as the filename (e.g. `fr.json`, `ar.json`, `zh-TW.json`).

Start from all 23 UI keys. Add as many `region.*` keys as you have verified translations for; omit the rest.

Validate JSON syntax before proceeding.

### 2b. Register the locale in i18n/index.ts

1. Add the import:
   ```ts
   import fr from './fr.json'
   ```

2. Add to `SUPPORTED`:
   ```ts
   export const SUPPORTED = ['en', 'he', 'fr'] as const
   ```

3. Add to the `resources` map in `initI18n`:
   ```ts
   resources: { en: { translation: en }, he: { translation: he }, fr: { translation: fr } },
   ```

4. Add to `dirFor` if RTL:
   ```ts
   export function dirFor(locale: string): 'ltr' | 'rtl' {
     return ['he', 'ar', 'fa'].includes(locale) ? 'rtl' : 'ltr'
   }
   ```

---

## Stage 3 — Test / Gate

### 3a. Coverage check with check-locale.mjs

Run the locale-coverage checker against the new file:

```bash
node .claude/skills/add-language/check-locale.mjs src/i18n/en.json src/i18n/<locale>.json
```

**Interpreting the output:**
- `OK: … covers all 248 keys` — all keys present, fully covered.
- `MISSING N keys in …:` with a list — the checker exits non-zero. This is **expected and acceptable** when the missing keys are all `region.*` keys (the documented fallback). It is **not acceptable** if any of the listed keys are UI keys (keys that do not start with `region.`).

To confirm no UI key is missing, filter the gap report:
```bash
node .claude/skills/add-language/check-locale.mjs src/i18n/en.json src/i18n/<locale>.json 2>&1 | grep -v '^region\.' | grep -v '^MISSING' || true
```
If any non-`region.` key appears in the output, translate it before shipping.

### 3b. Direction check

In a browser or jsdom test, confirm `dirFor('<locale>')` returns the correct value:
```ts
expect(dirFor('ar')).toBe('rtl')
expect(dirFor('fr')).toBe('ltr')
```

Confirm `document.dir` is set by calling `initI18n('<locale>')` and checking the DOM attribute in the app's locale-change handler.

### 3c. Smoke test via npm test

```bash
npm test
```

All tests must pass. The i18n test suite (`src/i18n/i18n.test.ts`) checks `SUPPORTED` membership and `dirFor`; adding the locale to `SUPPORTED` automatically extends those checks.

### 3d. Region-name gap report

Document the count of missing region-name translations in the PR description:
```
Region-name coverage: 42 / 248 keys translated; 206 fall back to English (expected).
```

---

## Stage 4 — Document

Append a new ADR to `docs/decisions/` using the project ADR template. Record:
- The locale tag and language name.
- Text direction (`ltr` or `rtl`).
- Source(s) used for UI strings and region names.
- Count of translated region names vs. total, and any notable gaps.
- Attribution / licence for any third-party translation data used.

Add a one-line entry to `docs/decisions-log.md`.

Reference the ADR in the commit message:
```
feat(i18n): add French (fr) locale (ADR 00XX)
```

---

## Checklist

- [ ] All 23 UI keys translated (no invented region names)
- [ ] Region gaps listed for human review in PR description
- [ ] `src/i18n/<locale>.json` created with valid JSON
- [ ] Imported and added to `SUPPORTED` in `src/i18n/index.ts`
- [ ] Added to `resources` map in `initI18n`
- [ ] `dirFor` updated if RTL
- [ ] `check-locale.mjs` run; any missing keys confirmed to be `region.*` only
- [ ] `npm test` passes
- [ ] `document.dir` flips correctly for RTL locales
- [ ] Region-name coverage count documented in PR description
- [ ] ADR written and decisions-log updated
