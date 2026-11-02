import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env.config';
// Selenoid dinonaktifkan sementara (lihat fixtures/browser-fixture.ts)
// import type { BrowserOptions } from './fixtures/browser-fixture';

const isCI = !!process.env.CI;

// Selenoid aktif: defineConfig<{}, BrowserOptions>({
export default defineConfig({
  // ── Lapisan 1: cara test dijalankan ─────────────────────────────
  testDir: './tests',
  outputDir: './test-results', // screenshot, video, trace dari test yang gagal
  timeout: 30_000, // batas satu test (termasuk beforeEach & fixture)
  expect: { timeout: 5_000 }, // batas retry satu expect (pengganti Thread.Sleep)
  fullyParallel: true,
  forbidOnly: isCI, // CI gagal kalau ada test.only yang lupa dihapus
  retries: isCI ? 2 : 0, // lulus setelah retry = ditandai flaky di report
  workers: isCI ? 2 : undefined, // undefined = otomatis (setengah core CPU)
  reporter: [['list'], ['html', { open: 'never' }]],

  // ── Lapisan 2: pengaturan browser untuk semua project ───────────
  // Selenium: capability di Browsers.cs
  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-test', // saucedemo memakai data-test, bukan data-testid
    headless: env.headless, // HEADLESS=false di .env untuk melihat browser
    launchOptions: { slowMo: env.slowMo }, // SLOW_MO=500 di .env untuk memperlambat tiap aksi
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta', // Selenoid: timeZone
    actionTimeout: 10_000, // batas satu klik/isi; gagal cepat dengan pesan jelas
    navigationTimeout: 15_000, // batas page.goto / perpindahan halaman
    // Selenium: screenshot manual di [AfterScenario]; di sini cukup konfigurasi
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // ── Lapisan 3: projects (variasi run) ───────────────────────────
  // Selenium: SeleniumBrowser di runsettings. Jalankan satu project: --project=chrome
  projects: [
    // API tidak butuh browser, cukup jalan sekali
    { name: 'api', testDir: './tests/api' },

    // channel = pakai browser asli yang terinstall di PC, bukan Chromium bawaan Playwright
    // remoteBrowser = browser yang diminta ke Selenoid kalau IS_SELENOID=true (fixtures/browser-fixture.ts)
    {
      name: 'chrome',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        // remoteBrowser: { browserName: 'chrome', browserVersion: env.selenoid.chromeVersion },
      },
    },
    // Edge dinonaktifkan sementara: e2e cukup jalan di Chrome
    // {
    //   name: 'edge',
    //   testDir: './tests/e2e',
    //   // Edge di Selenoid tidak tersedia ("Requested environment is not available"), jadi tanpa remoteBrowser
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
  ],
});
