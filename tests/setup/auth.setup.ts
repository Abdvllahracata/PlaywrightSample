import { env } from '../../config/env.config';
import { test as setup } from '../../fixtures/base-fixture';

/**
 * Logs in once before the e2e projects run and saves the session (cookies and localStorage) to env.authFile.
 * The e2e projects (chrome, edge, and firefox) load this file through storageState, so each test starts already logged in
 * without filling in the login form again. The login form itself is still covered by tests/e2e/login.spec.ts.
 */
setup('Login dan simpan sesi', async ({ loginPage, homePage, page }) => {
  await loginPage.openAndLogin();
  await homePage.expectLoaded();
  await page.context().storageState({ path: env.authFile });
});
