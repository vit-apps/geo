import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5175/', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const swInfo = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      registered: !!reg,
      scope: reg?.scope,
      state: reg?.active?.state,
      controller: !!navigator.serviceWorker.controller
    };
  });
  
  console.log('Service Worker info:', JSON.stringify(swInfo, null, 2));
  await browser.close();
}

main().catch(console.error);
