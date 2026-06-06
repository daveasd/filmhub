/**
 * Live QA for https://dawit-filmhub.vercel.app
 * Run: npx playwright test tests/qa-live.spec.mjs --reporter=list
 */
import { test, expect, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE = 'https://dawit-filmhub.vercel.app';
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'qa-screenshots');

const results = { passed: [], failed: [], bugs: [] };

function record(name, ok, detail = '') {
  if (ok) results.passed.push({ name, detail });
  else results.failed.push({ name, detail });
}

function bug(severity, title, steps, suggestion = '') {
  results.bugs.push({ severity, title, steps, suggestion });
}

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

async function snap(page, name) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function resetIntro(page) {
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.removeItem('filmhub_intro_seen');
    sessionStorage.removeItem('filmhub_guest_session');
  });
  await page.reload();
}

test.describe('FilmHub Live QA — Desktop', () => {
  test.setTimeout(120000);

  test('full site walkthrough', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => consoleErrors.push(e.message));

    const failedRequests = [];
    page.on('response', (res) => {
      const url = res.url();
      if (res.status() >= 400 && !url.includes('favicon')) {
        failedRequests.push(`${res.status()} ${url.slice(0, 120)}`);
      }
    });

    // 1. Intro
    await resetIntro(page);
    const introTitle = page.getByRole('heading', {
      name: /Hello, welcome to Dave's FilmHub/i,
    });
    await expect(introTitle).toBeVisible({ timeout: 15000 });
    record('1. Landing/intro screen', true);

    // 3. Continue to Login (opens auth modal) — use fresh intro
    await page.getByRole('button', { name: /Continue to Login/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({
      timeout: 8000,
    });
    record('3. Continue to Login', true);
    await page.getByRole('button', { name: 'Close' }).click().catch(() => page.keyboard.press('Escape'));

    // 2. Guest mode — fresh intro
    await resetIntro(page);
    await page.getByRole('button', { name: /Continue as Guest/i }).click();

    await expect(page.getByText(/Browse by mood|For You|Trending/i).first()).toBeVisible({
      timeout: 20000,
    });
    record('2. Continue as Guest', true);

    // 4-6. Auth validation (open modal)
    await page.getByRole('navigation').getByRole('button', { name: /Sign In/i }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    await page.locator('form').getByRole('button', { name: /^Sign In$/i }).click();
    await expect(page.locator('text=/email|password|wrong|invalid|Please/i').first()).toBeVisible({
      timeout: 5000,
    });
    record('6. Sign in validation (empty submit)', true);

    await page.getByRole('button', { name: /Sign up/i }).click();
    await page.locator('form').getByRole('button', { name: /Create Account/i }).click();
    const signupErr = page.locator('text=/Username|Password|required|characters/i').first();
    await expect(signupErr).toBeVisible({ timeout: 5000 });
    record('4-5. Sign up validation', true);

    await page.getByRole('button', { name: 'Close' }).click().catch(() => page.keyboard.press('Escape'));

    // 6. Home movie rows
    await expect(page.getByText('For You').first()).toBeVisible({ timeout: 15000 });
    const sliders = page.locator('h2').filter({ hasText: /Trending|Popular|Top Rated/i });
    await expect(sliders.first()).toBeVisible();
    record('6. Home page movie loading', true);

    // 7. Mood chips
    const moodBtn = page.getByRole('button', { name: /^Action$/i });
    if (await moodBtn.isVisible()) {
      await moodBtn.click();
      await expect(page.getByText(/Action Picks/i)).toBeVisible({ timeout: 15000 });
      record('7. Mood chips', true);
    } else {
      record('7. Mood chips', false, 'Action mood button not found');
      bug('medium', 'Mood chip Action not found', ['Home as guest', 'Look for Action button'], 'Check mood chip labels');
    }

    // 8. Search
    await page.getByRole('button', { name: /^Search$/i }).click();
    const searchInput = page.getByPlaceholder(/Type movie|search/i);
    await searchInput.fill('Inception');
    await page.waitForTimeout(1500);
    const cards = page.locator('[class*="MovieCard"], .group.relative.flex.flex-col').first();
    const hasResults = await page.getByText(/Inception/i).first().isVisible().catch(() => false);
    record('8. Search movies', hasResults, hasResults ? '' : 'No Inception result visible');

    // 9-10. Movie detail + trailer
    if (hasResults) {
      await page.getByText(/Inception/i).first().click();
      await page.waitForTimeout(2000);
      const detailVisible = await page.getByText(/Overview|Cast|Similar|Reviews/i).first().isVisible().catch(() => false);
      record('9. Movie detail page', detailVisible);
      const trailerBtn = page.getByRole('button', { name: /Trailer|Play/i }).first();
      if (await trailerBtn.isVisible().catch(() => false)) {
        await trailerBtn.click();
        await page.waitForTimeout(1000);
        const iframe = page.locator('iframe[title*="Trailer"], iframe').first();
        record('10. Watch trailer', await iframe.isVisible().catch(() => false));
        await page.keyboard.press('Escape').catch(() => {});
      } else {
        record('10. Watch trailer', false, 'Trailer button not found');
      }
      await page.getByRole('button', { name: /Back|ArrowLeft/i }).first().click().catch(() => page.goBack());
    }

    // 11-12. Watchlist / watched on home
    await page.getByRole('button', { name: /^Home$/i }).click();
    await page.waitForTimeout(1000);
    const firstCard = page.locator('.movie-card-cinematic, .group.relative.flex.flex-col').first();
    if (await firstCard.isVisible()) {
      await firstCard.hover();
      const wlBtn = page.getByTitle(/Watchlist/i).first();
      if (await wlBtn.isVisible()) {
        await wlBtn.click();
        record('11. Add watchlist', true);
        await wlBtn.click();
        record('11. Remove watchlist', true);
      }
      const watchedBtn = page.getByTitle(/Watched/i).first();
      if (await watchedBtn.isVisible()) {
        await watchedBtn.click();
        record('12. Mark watched', true);
      }
    }

    // 13. Reviews page
    await page.getByRole('button', { name: /^Reviews$/i }).click();
    await expect(page.getByText(/Reviews|review/i).first()).toBeVisible({ timeout: 10000 });
    record('13. Reviews page', true);

    // 14. AI Recs
    await page.getByRole('button', { name: /AI Recs/i }).click();
    await expect(page.getByText(/FilmHub AI/i).first()).toBeVisible({ timeout: 10000 });
    record('14. AI Recs page', true);

    // 15. Profile
    await page.getByRole('button', { name: /^Profile$/i }).click();
    await expect(page.getByText(/Profile|Watchlist|Watched/i).first()).toBeVisible({ timeout: 10000 });
    record('15. Profile page', true);

    // 16-21 Static pages via nav/footer
    const staticPages = [
      { nav: /About/i, expect: /About Dave|FilmHub/i, id: '16. About' },
      { nav: /Contact/i, expect: /Contact|daveasd86@gmail/i, id: '17. Contact' },
      { nav: /Report/i, expect: /Report a Problem/i, id: '18. Report' },
    ];

    for (const p of staticPages) {
      await page.getByRole('button', { name: p.nav }).click();
      await expect(page.getByText(p.expect).first()).toBeVisible({ timeout: 10000 });
      record(p.id, true);
    }

    await page.getByRole('button', { name: /^Feedback$/i }).click();
    await expect(page.getByText(/Feedback/i).first()).toBeVisible({ timeout: 10000 });
    record('19. Feedback page', true);

    await page.getByRole('button', { name: /^Privacy$/i }).click();
    await expect(page.getByText(/Privacy/i).first()).toBeVisible({ timeout: 10000 });
    record('20. Privacy page', true);

    await page.getByRole('button', { name: /^Terms$/i }).click();
    await expect(page.getByText(/Terms/i).first()).toBeVisible({ timeout: 10000 });
    record('21. Terms page', true);

    // 22. Footer links - GitHub visible on contact
    await page.getByRole('button', { name: /^Contact$/i }).click();
    const gh = page.getByText('github.com/daveasd86');
    const tg = page.getByText('t.me/feodc');
    record('22. Footer/Contact links', (await gh.isVisible()) && (await tg.isVisible()));

    // 27. Horizontal overflow
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    if (overflow) {
      bug('low', 'Horizontal scroll on desktop', ['Open home desktop', 'Check for horizontal scrollbar'], 'Fix overflow CSS');
      await snap(page, 'overflow-desktop');
    }
    record('27. No horizontal overflow (desktop)', !overflow);

    // 24-26 Console / network
    const criticalConsole = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load resource'),
    );
    if (criticalConsole.length > 0) {
      bug('medium', 'Console errors on desktop', ['Guest flow through site', `Errors: ${criticalConsole.slice(0, 3).join('; ')}`], 'Inspect console');
      await snap(page, 'console-errors-desktop');
    }
    record('24. Console errors (desktop)', criticalConsole.length === 0, criticalConsole.slice(0, 2).join('; '));

    const apiFails = failedRequests.filter((r) => r.includes('supabase') || r.includes('tmdb') || r.includes('api'));
    record('25. Critical API failures', apiFails.length === 0, apiFails.slice(0, 3).join('; '));

    // Broken images check on home
    const brokenImages = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      return imgs.filter((img) => img.naturalWidth === 0 && img.src && !img.src.includes('data:')).length;
    });
    if (brokenImages > 3) {
      bug('low', 'Multiple broken images', ['Load home page', `Count: ${brokenImages}`], 'Check TMDB poster paths');
    }
    record('26. Broken images (threshold)', brokenImages <= 5, `~${brokenImages} broken`);

    // Write report
    const reportPath = path.join(process.cwd(), 'tests', 'qa-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ consoleErrors, failedRequests, ...results }, null, 2));
  });
});

test('mobile responsive', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport);
    await page.goto(BASE);
    await page.evaluate(() => {
      localStorage.setItem('filmhub_intro_seen', 'true');
      sessionStorage.setItem('filmhub_guest_session', 'true');
    });
    await page.reload();
    await expect(page.getByText(/Browse by mood|For You/i).first()).toBeVisible({ timeout: 20000 });

    const menuBtn = page.getByRole('button', { name: /Menu/i });
    if (await menuBtn.isVisible()) await menuBtn.click();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    if (overflow) {
      bug('medium', 'Horizontal scroll on mobile', ['iPhone 13 viewport', 'Open home'], 'Fix responsive layout');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'overflow-mobile.png'), fullPage: true });
    }

    // Cursor glow should not show on mobile
    const cursorLayer = page.locator('.cursor-glow-layer');
    const cursorVisible = await cursorLayer.isVisible().catch(() => false);
    record('23. Mobile layout + menu', !overflow);
    record('5. Cursor hidden mobile', !cursorVisible || (await cursorLayer.evaluate((el) => getComputedStyle(el).display === 'none')));
});

test.afterAll(async () => {
  console.log('\n=== QA SUMMARY ===');
  console.log('Passed:', results.passed.length);
  console.log('Failed:', results.failed.length);
  console.log('Bugs:', results.bugs.length);
});
