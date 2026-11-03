import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env.config';
import type { BrowserOptions } from './fixtures/browser-fixture';

const isCI = !!process.env.CI;

/**
 * Main Playwright configuration, split into three layers: test execution, browser settings, and projects.
 * BrowserOptions adds the remoteBrowser option used by the Selenoid integration (IS_SELENOID=true).
 */
export default defineConfig<{}, BrowserOptions>({
  // ── Layer 1: Test execution ─────────────────────────────────────
  // A single test is limited to 30 seconds (including beforeEach and fixtures), while a single assertion is
  // retried for up to 5 seconds as a replacement for Thread.Sleep. Screenshots, videos, and traces of failed
  // tests are stored in test-results. On CI, the run fails if a test.only is left behind, failed tests are
  // retried twice (tests that pass after a retry are marked as flaky in the report), and workers are limited
  // to two. Locally, the number of workers is determined automatically (half of the CPU cores). On Selenoid,
  // workers follows SELENOID_WORKERS (default 1) because parallel sessions were closed by the server. Besides the
  // terminal list and the HTML report, the email reporter sends a summary after the run when it is enabled
  // (see the email section in config/env.config.ts). On CI, test-results/junit.xml is also written so the
  // Azure DevOps pipeline can publish the results to its Tests tab. metadata shows the application and active environment in the HTML report.
  testDir: './tests',
  outputDir: './test-results',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: env.selenoid.enabled ? env.selenoid.workers : isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./reporters/email-reporter.ts'],
    ...(isCI ? [['junit', { outputFile: 'test-results/junit.xml' }] as const] : []),
  ],
  metadata: { app: env.appName, environment: env.name, baseURL: env.baseUrl },

  // ── Layer 2: Browser settings for all projects ──────────────────
  // Equivalent to the capabilities in Browsers.cs. saucedemo uses the data-test attribute (not data-testid)
  // as its test id. Browser visibility is controlled by HEADLESS and SLOW_MO in .env. Each action (click/fill)
  // is limited to 10 seconds and each navigation to 15 seconds so failures are detected quickly (30 seconds on
  // Selenoid, where pages load more slowly because the browser runs on the remote server); timezoneId
  // is the equivalent of timeZone in Selenoid. Screenshots, videos, and traces are collected automatically
  // for failed tests only, replacing the manual screenshot in [AfterScenario].
  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-test',
    headless: env.headless,
    launchOptions: { slowMo: env.slowMo },
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    actionTimeout: 10_000,
    navigationTimeout: env.selenoid.enabled ? 30_000 : 15_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  // ── Layer 3: Projects (run variations) ──────────────────────────
  // Equivalent to SeleniumBrowser in runsettings; run a single project with --project=<name>.
  // - api: API tests without a browser, so they only need to run once.
  // - setup: logs in once and saves the session to env.authFile (tests/setup/auth.setup.ts). It runs
  //   automatically before every e2e project through dependencies, also when only one test is run. All e2e
  //   projects load the saved session through storageState, so tests start already logged in.
  // - chrome and edge: e2e tests on the browsers installed on this PC (channel), not Playwright's bundled Chromium.
  //   remoteBrowser defines the browser requested from Selenoid when IS_SELENOID=true; Edge is not available
  //   on Selenoid ("Requested environment is not available"), so the edge project has no remoteBrowser.
  // - firefox: e2e tests on Playwright's bundled Firefox (a different engine from Chrome and Edge), installed
  //   with npx playwright install firefox. It cannot run on Selenoid because Firefox does not support CDP.
  //   Its timeout is raised to 60 seconds because the first test in each Firefox worker spends about 16 seconds
  //   creating the browser context, which exceeds 30 seconds when it runs in parallel with the other browsers.
  // - safari (disabled): e2e tests on Playwright's WebKit build (the engine behind Safari), installed with
  //   npx playwright install webkit. It is not the branded Safari app, so results can differ slightly from
  //   real Safari; the closest match is WebKit on macOS. It cannot run on Selenoid because WebKit does not support CDP.
  //   It is disabled because its tests timed out now and then when running in parallel with the other browsers.
  //   To enable it again, uncomment the project below and add --project=safari back to test:e2e in package.json.
  projects: [
    { name: 'api', testDir: './tests/api' },
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        remoteBrowser: { browserName: 'chrome', browserVersion: env.selenoid.chromeVersion },
      },
    },
    {
      name: 'chrome',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: env.authFile,
        remoteBrowser: { browserName: 'chrome', browserVersion: env.selenoid.chromeVersion },
      },
    },
    {
      name: 'edge',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        storageState: env.authFile,
      },
    },
    {
      name: 'firefox',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      timeout: 60_000,
      use: {
        ...devices['Desktop Firefox'],
        storageState: env.authFile,
      },
    },
    // {
    //   name: 'safari',
    //   testDir: './tests/e2e',
    //   dependencies: ['setup'],
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: env.authFile,
    //   },
    // },
  ],
});
