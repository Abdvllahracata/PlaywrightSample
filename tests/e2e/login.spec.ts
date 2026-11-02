import { InvalidLoginCases, LoginData } from '../../data/testDataSource';
import { test } from '../../fixtures/base-fixture';

// Reqnroll: Feature = test.describe, Scenario = test, Background = beforeEach, @tag = { tag }
test.describe('Login', { tag: '@login' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('Login berhasil dengan user valid', { tag: '@smoke' }, async ({ loginPage, homePage }) => {
    await loginPage.login(LoginData.validUser);
    await homePage.expectLoaded();
  });

  // Data-driven (Reqnroll: Scenario Outline). Tiap baris InvalidLoginCases jadi test terpisah.
  for (const data of InvalidLoginCases) {
    test(`Login gagal - ${data.kasus}`, { tag: ['@regression', '@negative'] }, async ({ loginPage }) => {
      await loginPage.login(data.username, data.password);
      await loginPage.expectErrorMessage(data.message);
    });
  }
});
