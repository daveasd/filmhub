import { chromium } from '@playwright/test';

const base = process.env.BASE_URL || 'http://localhost:4173';

async function passGuestGate(page) {
  await page.goto(base);
  await page.waitForTimeout(1500);
  for (const name of [/guest/i, /continue as guest/i, /skip/i, /later/i]) {
    const btn = page.getByRole('button', { name });
    if (await btn.first().isVisible().catch(() => false)) {
      await btn.first().click();
      await page.waitForTimeout(700);
    }
  }
  await page.waitForSelector('nav', { timeout: 20000 });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await passGuestGate(page);

  await page.getByRole('link', { name: 'Contact' }).first().click();
  await page.waitForURL(/\/contact$/);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/$/);
  console.log('PASS: home → contact → back → home');

  await page.goto(`${base}/about`);
  await page.goto(`${base}/privacy`);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/about/);
  console.log('PASS: about → privacy → back → about');

  await page.getByRole('link', { name: 'Search' }).first().click();
  await page.waitForURL(/\/search$/);
  const movieLink = page.locator('main a[href^="/movie/"]').first();
  if (await movieLink.count()) {
    await movieLink.click();
    await page.waitForURL(/\/movie\//);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/search$/);
    console.log('PASS: search → movie → back → search');
  } else {
    console.log('SKIP: no movie links on search (empty results)');
  }

  await browser.close();
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
