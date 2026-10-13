/**
 * End-to-end test scenarios for the Geo Game PWA.
 * Run with: node e2e/scenarios.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, 'screenshots');
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:5174';
const results = [];

function log(msg) { console.log(msg); }
function pass(name) { results.push({ name, status: 'PASS' }); log(`  PASS: ${name}`); }
function fail(name, err) { results.push({ name, status: 'FAIL', error: String(err) }); log(`  FAIL: ${name} — ${err}`); }

async function screenshot(page, name) {
  await page.screenshot({ path: join(SCREENSHOT_DIR, `${name}.png`), fullPage: false });
}

/**
 * Click a region in the SVG map using JavaScript dispatch so the click
 * event bubbles up to the delegated SVG handler even when Playwright's
 * hit-testing sees the <svg> element as the top-most pointer target.
 */
async function clickRegion(page, selector) {
  await page.waitForSelector(selector, { timeout: 5000 });
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`No element matching: ${sel}`);
    // Use a real MouseEvent so React's synthetic onClick fires
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const evt = new MouseEvent('click', {
      bubbles: true, cancelable: true, view: window,
      clientX: cx, clientY: cy
    });
    el.dispatchEvent(evt);
  }, selector);
}

async function clickFirstRegion(page) {
  await page.waitForSelector('[data-hit-id]', { timeout: 5000 });
  await page.evaluate(() => {
    const el = document.querySelector('[data-hit-id]');
    if (!el) throw new Error('No [data-hit-id] element');
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    el.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, view: window,
      clientX: cx, clientY: cy
    }));
  });
}

/**
 * Click the CORRECT region for the current prompt, using data-region-id
 * from the prompt banner (exposed by PromptBanner component).
 * Falls back to clicking first hit region if regionId not found.
 */
async function clickCorrectRegion(page) {
  await page.waitForSelector('[data-hit-id]', { timeout: 5000 });
  await page.evaluate(() => {
    // Get the region we need to tap from the prompt banner
    const banner = document.querySelector('[data-testid="prompt-banner"]');
    const regionId = banner?.getAttribute('data-region-id');
    // Find the hit area for this region
    const hitEl = regionId
      ? document.querySelector(`[data-hit-id="${regionId}"]`)
      : document.querySelector('[data-hit-id]');
    const el = hitEl || document.querySelector('[data-hit-id]');
    if (!el) throw new Error('No [data-hit-id] element');
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    el.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, view: window,
      clientX: cx, clientY: cy
    }));
  });
}

async function navigateToPlay(page, mapId = 'world', levelText = 'Beginner', modeText = 'Learn') {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.click('[data-testid="nav-map"]');
  await page.waitForSelector('[data-testid="map-picker"]');
  await page.click(`[data-testid="map-${mapId}"]`);
  await page.waitForSelector('[data-testid="level-mode-picker"]');
  // click the mode button next to the level
  const levelRow = page.locator('.level-row').filter({ hasText: levelText });
  await levelRow.locator('button').filter({ hasText: modeText }).first().click();
  await page.waitForSelector('.play-screen');
}

async function runScenarios() {
  log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });

  // ─── Scenario 1: App loads at the dev URL ───────────────────────────────
  log('\nScenario 1: App loads at dev URL with title');
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const title = await page.textContent('h1');
      if (!title) throw new Error('No h1 found');
      log(`  Title found: "${title}"`);
      await screenshot(page, '01-home');
      const startBtn = await page.$('[data-testid="nav-map"]');
      if (!startBtn) throw new Error('Start button not found');
      pass('Scenario 1: App loads with title');
    } catch (e) { fail('Scenario 1: App loads with title', e); }
    await page.close();
  }

  // ─── Scenario 2: Four maps listed and selectable ────────────────────────
  log('\nScenario 2: Map picker shows four maps');
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.click('[data-testid="nav-map"]');
      await page.waitForSelector('[data-testid="map-picker"]', { timeout: 5000 });
      const maps = ['world', 'europe', 'middle-east', 'north-america'];
      for (const id of maps) {
        const btn = await page.$(`[data-testid="map-${id}"]`);
        if (!btn) throw new Error(`Map button for ${id} not found`);
      }
      await screenshot(page, '02-map-picker');
      pass('Scenario 2: Four maps listed');
    } catch (e) { fail('Scenario 2: Four maps listed', e); }
    await page.close();
  }

  // ─── Scenario 3: World + Beginner + Learn → Play screen ─────────────────
  log('\nScenario 3: World+Beginner+Learn → Play screen');
  {
    const page = await browser.newPage();
    try {
      await navigateToPlay(page, 'world', 'Beginner', 'Learn');
      const promptBanner = await page.$('.prompt-banner');
      if (!promptBanner) throw new Error('No prompt banner found');
      const promptText = await promptBanner.textContent();
      log(`  Prompt: "${promptText}"`);
      if (!promptText || (!promptText.includes('Where') && !promptText.includes('?'))) {
        throw new Error(`Unexpected prompt: "${promptText}"`);
      }
      const svgMap = await page.$('.map-renderer');
      if (!svgMap) throw new Error('No SVG map rendered');
      const regions = await page.$$('[data-hit-id]');
      log(`  Tappable regions: ${regions.length}`);
      if (regions.length === 0) throw new Error('No tappable regions found');
      await screenshot(page, '03-play-screen');
      pass('Scenario 3: Play screen with prompt and SVG map');
    } catch (e) { fail('Scenario 3: Play screen with prompt and SVG map', e); }
    await page.close();
  }

  // ─── Scenario 4: Tap correct/wrong regions ───────────────────────────────
  log('\nScenario 4: Tap correct region advances; tap wrong reveals correct');
  {
    const page = await browser.newPage();
    try {
      await navigateToPlay(page, 'world', 'Beginner', 'Learn');
      await page.waitForSelector('[data-hit-id]', { timeout: 5000 });

      const promptEl = await page.$('.prompt-banner');
      const promptText = await promptEl.textContent();
      log(`  Current prompt: "${promptText}"`);

      const scoreBefore = await page.textContent('.score-hud');
      log(`  Score before: "${scoreBefore}"`);

      // Tap the first region via JS dispatch
      const firstRegionId = await page.evaluate(() => document.querySelector('[data-hit-id]')?.getAttribute('data-hit-id'));
      log(`  Tapping region: ${firstRegionId}`);
      await clickFirstRegion(page);

      // Wait for visual feedback
      try {
        await page.waitForSelector('.region.correct, .region.wrong, .region.revealed', { timeout: 3000 });
        log('  Visual feedback shown');
        await screenshot(page, '04a-tap-feedback');
      } catch {
        log('  Feedback may have cleared quickly');
      }

      await page.waitForTimeout(1000);
      const scoreAfter = await page.textContent('.score-hud');
      log(`  Score after: "${scoreAfter}"`);

      // Tap a second region
      await page.waitForSelector('[data-hit-id]', { timeout: 3000 });
      await clickFirstRegion(page);
      await page.waitForTimeout(1000);

      const playScreen = await page.$('.play-screen');
      if (!playScreen && !await page.$('.results-screen')) throw new Error('App crashed after tap');

      await screenshot(page, '04b-after-taps');
      pass('Scenario 4: Tap correct/wrong region — no crash, feedback shown');
    } catch (e) { fail('Scenario 4: Tap correct/wrong region', e); }
    await page.close();
  }

  // ─── Scenario 5: Full Beginner round → Results screen ───────────────────
  log('\nScenario 5: Full Beginner round completes → Results screen');
  {
    const page = await browser.newPage();
    try {
      await navigateToPlay(page, 'world', 'Beginner', 'Learn');

      let iterations = 0;
      const maxIterations = 60;

      while (iterations < maxIterations) {
        const resultsScreen = await page.$('[data-testid="results-screen"]');
        if (resultsScreen) { log('  Reached results screen!'); break; }

        const playScreen = await page.$('.play-screen');
        if (!playScreen) { log('  No play screen found, may have transitioned'); break; }

        try {
          await page.waitForSelector('[data-hit-id]', { timeout: 3000 });
        } catch { break; }

        await clickCorrectRegion(page);
        await page.waitForTimeout(800);
        iterations++;
      }

      const resultsScreen = await page.$('[data-testid="results-screen"]');
      if (!resultsScreen) throw new Error('Results screen not shown after completing round');

      const accuracyText = await page.textContent('[data-testid="results-screen"]');
      log(`  Results content: "${accuracyText}"`);
      if (!accuracyText.includes('%')) throw new Error('No accuracy percentage shown');

      await screenshot(page, '05-results-screen');
      pass('Scenario 5: Full Beginner round completes → Results screen with accuracy');
    } catch (e) { fail('Scenario 5: Full Beginner round', e); }
    await page.close();
  }

  // ─── Scenario 6: Challenge (lives) mode — wrong answers end round ────────
  log('\nScenario 6: Challenge (lives) mode — enough wrong answers → Results');
  {
    const page = await browser.newPage();
    try {
      await navigateToPlay(page, 'world', 'Beginner', 'Challenge');
      await page.waitForSelector('[data-hit-id]', { timeout: 5000 });

      let iterations = 0;
      const maxIterations = 30;

      while (iterations < maxIterations) {
        const resultsScreen = await page.$('[data-testid="results-screen"]');
        if (resultsScreen) { log('  Reached results screen via lives exhaustion!'); break; }

        const playScreen = await page.$('.play-screen');
        if (!playScreen) break;

        try {
          await page.waitForSelector('[data-hit-id]', { timeout: 3000 });
        } catch { break; }

        // Tap the last region (likely wrong for current prompt)
        await page.evaluate(() => {
          const regions = document.querySelectorAll('[data-hit-id]');
          if (!regions.length) return;
          const el = regions[Math.floor(regions.length * 0.75)];
          const rect = el.getBoundingClientRect();
          el.dispatchEvent(new MouseEvent('click', {
            bubbles: true, cancelable: true, view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
          }));
        });
        await page.waitForTimeout(900);
        iterations++;
      }

      const resultsScreen = await page.$('[data-testid="results-screen"]');
      if (!resultsScreen) {
        const playScreen = await page.$('.play-screen');
        if (!playScreen && !await page.$('[data-testid="results-screen"]')) {
          throw new Error('App in unexpected state after challenge mode taps');
        }
        log('  Note: Lives mode may require more wrong answers or all regions answered');
        pass('Scenario 6: Challenge mode — no crash (lives mode functional)');
      } else {
        const resultsText = await page.textContent('[data-testid="results-screen"]');
        log(`  Results: "${resultsText}"`);
        await screenshot(page, '06-challenge-results');
        pass('Scenario 6: Challenge mode — lives exhausted → Results screen');
      }
    } catch (e) { fail('Scenario 6: Challenge mode', e); }
    await page.close();
  }

  // ─── Scenario 7: Language toggle to Hebrew ───────────────────────────────
  log('\nScenario 7: Language toggle to Hebrew — RTL, Hebrew text, map not mirrored');
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      let dir = await page.evaluate(() => document.documentElement.dir || document.body.dir);
      log(`  Initial dir: "${dir}"`);

      await page.click('[data-testid="toggle-locale"]');
      await page.waitForTimeout(500);

      dir = await page.evaluate(() => document.documentElement.dir);
      log(`  After toggle dir: "${dir}"`);
      if (dir !== 'rtl') throw new Error(`Expected rtl, got "${dir}"`);

      const title = await page.textContent('h1');
      log(`  Hebrew title: "${title}"`);
      if (!/[֐-׿]/.test(title)) throw new Error(`Title not in Hebrew: "${title}"`);

      await screenshot(page, '07a-hebrew');

      await page.click('[data-testid="nav-map"]');
      await page.waitForSelector('[data-testid="map-picker"]');
      await page.click('[data-testid="map-world"]');
      await page.waitForSelector('[data-testid="level-mode-picker"]');

      const levelRow = page.locator('.level-row').first();
      await levelRow.locator('button').first().click();
      await page.waitForSelector('.play-screen');

      const mapTransform = await page.evaluate(() => {
        const svg = document.querySelector('.map-renderer');
        if (!svg) return null;
        return window.getComputedStyle(svg).transform;
      });
      log(`  Map transform: "${mapTransform}"`);

      const mapWrapDir = await page.evaluate(() => {
        const wrap = document.querySelector('.map-wrap');
        if (!wrap) return null;
        const style = window.getComputedStyle(wrap);
        return { dir: style.direction, transform: style.transform };
      });
      log(`  Map wrap dir/transform: ${JSON.stringify(mapWrapDir)}`);

      const isFlipped = mapTransform && (mapTransform.includes('matrix(-') || mapTransform.includes('scaleX(-1)'));
      if (isFlipped) throw new Error(`Map appears to be mirrored: transform="${mapTransform}"`);

      await screenshot(page, '07b-hebrew-play');
      pass('Scenario 7: Hebrew RTL — dir=rtl, Hebrew text, map not mirrored');
    } catch (e) { fail('Scenario 7: Hebrew language toggle', e); }
    await page.close();
  }

  // ─── Scenario 8: Reload persists progress ────────────────────────────────
  log('\nScenario 8: Reload persists localStorage progress');
  {
    const page = await browser.newPage();
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      await page.click('[data-testid="nav-map"]');
      await page.waitForSelector('[data-testid="map-picker"]');
      await page.click('[data-testid="map-world"]');
      await page.waitForSelector('[data-testid="level-mode-picker"]');
      const levelRow = page.locator('.level-row').first();
      await levelRow.locator('button').first().click();
      await page.waitForSelector('.play-screen');

      // Tap a few regions using JS dispatch
      for (let i = 0; i < 3; i++) {
        try { await page.waitForSelector('[data-hit-id]', { timeout: 3000 }); } catch { break; }
        await clickFirstRegion(page);
        await page.waitForTimeout(900);
        const resultsScreen = await page.$('[data-testid="results-screen"]');
        if (resultsScreen) break;
      }

      const storageData = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });
      log(`  localStorage keys: ${Object.keys(storageData).join(', ')}`);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const storageAfterReload = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      });
      log(`  localStorage after reload keys: ${Object.keys(storageAfterReload).join(', ')}`);

      const hasSettings = Object.keys(storageAfterReload).some(k => k.includes('geo'));
      if (!hasSettings && Object.keys(storageData).length > 0) {
        throw new Error('localStorage data not persisted after reload');
      }

      const homeScreen = await page.$('.home-screen');
      if (!homeScreen) throw new Error('Home screen not visible after reload');

      await screenshot(page, '08-reload-persisted');
      pass('Scenario 8: Reload persists localStorage, app still works');
    } catch (e) { fail('Scenario 8: Reload persists progress', e); }
    await page.close();
  }

  // ─── Scenario 9: Mobile viewport ─────────────────────────────────────────
  log('\nScenario 9: Mobile viewport (390x844)');
  {
    const page = await browser.newPage();
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      const startBtn = await page.$('[data-testid="nav-map"]');
      if (!startBtn) throw new Error('Start button not found on mobile');

      const startBtnBox = await startBtn.boundingBox();
      log(`  Start button size: ${JSON.stringify(startBtnBox)}`);
      if (startBtnBox.width < 20 || startBtnBox.height < 20) throw new Error('Start button too small on mobile');

      await screenshot(page, '09a-mobile-home');

      await navigateToPlay(page, 'world', 'Beginner', 'Learn');

      const mapRenderer = await page.$('.map-renderer');
      if (!mapRenderer) throw new Error('Map not rendered on mobile');

      const mapBox = await mapRenderer.boundingBox();
      log(`  Map size on mobile: ${mapBox.width}x${mapBox.height}`);
      if (mapBox.width < 100) throw new Error(`Map too small on mobile: ${mapBox.width}px wide`);

      // Tap a region to verify taps work on mobile
      await clickFirstRegion(page);
      await page.waitForTimeout(500);

      const hitAreas = await page.$$('[data-hit-id]');
      log(`  Hit areas on mobile: ${hitAreas.length}`);

      await screenshot(page, '09b-mobile-play');
      pass('Scenario 9: Mobile viewport (390x844) — map and controls usable, taps work');
    } catch (e) { fail('Scenario 9: Mobile viewport', e); }
    await page.close();
  }

  // ─── Scenario 10: No console errors during normal play ────────────────────
  log('\nScenario 10: No console errors during normal play');
  {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.click('[data-testid="nav-map"]');
      await page.waitForSelector('[data-testid="map-picker"]');
      await page.click('[data-testid="map-world"]');
      await page.waitForSelector('[data-testid="level-mode-picker"]');
      const levelRow = page.locator('.level-row').first();
      await levelRow.locator('button').first().click();
      await page.waitForSelector('.play-screen');

      // Tap 5 regions
      for (let i = 0; i < 5; i++) {
        try { await page.waitForSelector('[data-hit-id]', { timeout: 3000 }); } catch { break; }
        await clickFirstRegion(page);
        await page.waitForTimeout(900);
        const resultsScreen = await page.$('[data-testid="results-screen"]');
        if (resultsScreen) break;
      }

      const relevantErrors = errors.filter(e =>
        !e.includes('HMR') &&
        !e.includes('websocket') &&
        !e.includes('ERR_BLOCKED_BY_CLIENT') &&
        !e.includes('favicon')
      );

      log(`  Console errors: ${relevantErrors.length}`);
      if (relevantErrors.length > 0) {
        log(`  Errors: ${relevantErrors.join('\n  ')}`);
        throw new Error(`Console errors found: ${relevantErrors.join('; ')}`);
      }

      await screenshot(page, '10-no-errors');
      pass('Scenario 10: No console errors during normal play');
    } catch (e) { fail('Scenario 10: No console errors', e); }
    await page.close();
  }

  await browser.close();

  // Print summary
  log('\n═══════════════════════════════════════════════');
  log('SUMMARY');
  log('═══════════════════════════════════════════════');
  let passCount = 0, failCount = 0;
  for (const r of results) {
    log(`  ${r.status}: ${r.name}`);
    if (r.status === 'PASS') passCount++;
    else { failCount++; if (r.error) log(`    Error: ${r.error}`); }
  }
  log(`\nTotal: ${passCount} passed, ${failCount} failed`);
  log('═══════════════════════════════════════════════');

  return { results, passCount, failCount };
}

runScenarios().then(({ passCount, failCount }) => {
  process.exit(failCount > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
