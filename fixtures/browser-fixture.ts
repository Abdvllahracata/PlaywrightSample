import { test as base } from '@playwright/test';
// Selenoid dinonaktifkan sementara: semua test jalan di browser lokal.
// Untuk mengaktifkan lagi, buka comment di bawah, hapus "export const test = base", dan buka comment remoteBrowser di playwright.config.ts
// import { chromium } from '@playwright/test';
// import { env } from '../config/env.config';
// import { RemoteBrowser, SelenoidSession } from '../utils/selenoidClient';

export const test = base;

// // Option per project di playwright.config.ts: browser yang diminta ke Selenoid
// export type BrowserOptions = {
//   remoteBrowser: RemoteBrowser | undefined;
// };
//
// const localTest = base.extend<{}, BrowserOptions>({
//   remoteBrowser: [undefined, { scope: 'worker', option: true }],
// });
//
// // IS_SELENOID=true: fixture bawaan "browser" diganti browser dari Selenoid.
// // Scope worker = satu sesi Selenoid per worker; tiap test tetap dapat context (cookie, storage) baru.
// const selenoidTest = localTest.extend({
//   browser: [
//     async ({ playwright, remoteBrowser }, use, workerInfo) => {
//       if (!remoteBrowser) {
//         throw new Error(`Project "${workerInfo.project.name}" tidak tersedia di Selenoid (remoteBrowser kosong di playwright.config.ts)`);
//       }
//       const session = await SelenoidSession.create(
//         playwright.request,
//         remoteBrowser,
//         `Playwright ${workerInfo.project.name} - worker ${workerInfo.workerIndex}`,
//       );
//       try {
//         const browser = await chromium.connectOverCDP(session.cdpUrl, { headers: session.headers });
//         await use(browser);
//         await browser.close();
//       } finally {
//         // Selalu tutup sesi, termasuk saat test gagal (Selenium: Browser.Close())
//         await session.delete();
//       }
//     },
//     { scope: 'worker', timeout: 60_000 },
//   ],
// });
//
// export const test = env.selenoid.enabled ? selenoidTest : localTest;
