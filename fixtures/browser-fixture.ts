import { chromium, test as base } from '@playwright/test';
import { env } from '../config/env.config';
import { RemoteBrowser, SelenoidSession } from '../utils/selenoidClient';

/** Per-project option in playwright.config.ts: the browser requested from Selenoid. */
export type BrowserOptions = {
  remoteBrowser: RemoteBrowser | undefined;
};

const localTest = base.extend<{}, BrowserOptions>({
  remoteBrowser: [undefined, { scope: 'worker', option: true }],
});

/**
 * IS_SELENOID=true: the built-in "browser" fixture is replaced with a browser from Selenoid.
 * Worker scope: one Selenoid session per worker; each test still gets a fresh context (cookies, storage).
 */
const selenoidTest = localTest.extend({
  browser: [
    async ({ playwright, remoteBrowser }, use, workerInfo) => {
      if (!remoteBrowser) {
        throw new Error(`Project "${workerInfo.project.name}" tidak tersedia di Selenoid (remoteBrowser kosong di playwright.config.ts)`);
      }
      const session = await SelenoidSession.create(
        playwright.request,
        remoteBrowser,
        `Playwright ${workerInfo.project.name} - worker ${workerInfo.workerIndex}`,
      );
      try {
        const browser = await chromium.connectOverCDP(session.cdpUrl, { headers: session.headers });
        await use(browser);
        await browser.close();
      } finally {
        // The session is always closed, including when a test fails (the equivalent of Browser.Close() in Selenium)
        await session.delete();
      }
    },
    { scope: 'worker', timeout: 60_000 },
  ],

  // Each test gets its own Chrome window next to the empty window that Selenoid opens with the session, so the
  // window is resized to the full Selenoid screen (SELENOID_SCREEN_RESOLUTION) and covers the empty one.
  // Explicit bounds are used instead of windowState 'maximized', which needs a window manager in the container.
  page: async ({ page }, use) => {
    const [width, height] = env.selenoid.screenResolution.split('x').map(Number);
    const cdp = await page.context().newCDPSession(page);
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    await cdp.send('Browser.setWindowBounds', { windowId, bounds: { left: 0, top: 0, width, height, windowState: 'normal' } });
    await cdp.detach();
    await use(page);
  },
});

export const test = env.selenoid.enabled ? selenoidTest : localTest;
