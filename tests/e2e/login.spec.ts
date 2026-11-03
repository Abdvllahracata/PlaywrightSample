import { InvalidLoginCases, LoginData } from '../../data/testData';
import { test } from '../../fixtures/base-fixture';

// Reqnroll equivalents: Feature = test.describe, Scenario = test, Background = beforeEach, @tag = { tag }
test.describe('Login', { tag: '@login' }, () => {
  // Login tests must start logged out, so the session saved by the setup project is not loaded here
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('Login berhasil dengan user valid', { tag: '@smoke' }, async ({ loginPage, homePage }) => {
    await loginPage.login(LoginData.validUser);
    await homePage.expectLoaded();
  });

  // Data-driven test (the equivalent of a Scenario Outline): each row of InvalidLoginCases becomes a separate test
  for (const data of InvalidLoginCases) {
    test(`Login gagal - ${data.kasus}`, { tag: ['@regression', '@negative'] }, async ({ loginPage }) => {
      await loginPage.login(data.username, data.password);
      await loginPage.expectErrorMessage(data.message);
    });
  }
});
