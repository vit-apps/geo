import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
await page.click('[data-testid="nav-map"]');
await page.waitForSelector('[data-testid="map-picker"]');
await page.click('[data-testid="map-world"]');
await page.waitForSelector('[data-testid="level-mode-picker"]');
const levelRow = page.locator('.level-row').first();
await levelRow.locator('button').first().click();
await page.waitForSelector('.play-screen');
await page.waitForSelector('[data-hit-id]', { timeout: 5000 });

// Check what elementFromPoint returns for a hit area
const result = await page.evaluate(() => {
  const hitEl = document.querySelector('[data-hit-id]');
  if (!hitEl) return { error: 'no hit el' };
  const bbox = hitEl.getBoundingClientRect();
  const centerX = bbox.left + bbox.width / 2;
  const centerY = bbox.top + bbox.height / 2;
  const topEl = document.elementFromPoint(centerX, centerY);
  return {
    hitElClass: hitEl.className,
    hitId: hitEl.getAttribute('data-hit-id'),
    topElTag: topEl?.tagName,
    topElClass: topEl?.className,
    topElHitId: topEl?.getAttribute('data-hit-id'),
    topElRegionId: topEl?.getAttribute('data-region-id'),
    sameAsHit: topEl === hitEl,
    bbox: { x: bbox.left, y: bbox.top, w: bbox.width, h: bbox.height }
  };
});
console.log('elementFromPoint result:', JSON.stringify(result, null, 2));

// Try clicking the hit area using dispatchEvent
const clicked = await page.evaluate(() => {
  const hitEl = document.querySelector('[data-hit-id]');
  if (!hitEl) return false;
  hitEl.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  return true;
});
console.log('dispatched click:', clicked);
await page.waitForTimeout(200);
const stillPlay = await page.$('.play-screen');
console.log('still on play screen:', !!stillPlay);

await browser.close();
