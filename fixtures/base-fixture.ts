import { env } from '../config/env.config';
import { test as base } from './browser-fixture'; // browser lokal (Selenoid sedang dinonaktifkan)
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { ApiHelper } from '../utils/apiHelper';

type Fixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  api: ApiHelper;
};

// Pengganti Hooks.cs + BasePages + BasePagesHelper.
// Kode sebelum use() = setup ([BeforeScenario]), sesudah use() = teardown ([AfterScenario]).
// Browser/page dibuka dan ditutup otomatis oleh Playwright, hanya kalau fixture page dipakai.
// Semua test import { test, expect } dari file ini, bukan dari '@playwright/test'.
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  api: async ({ playwright }, use) => {
    const request = await playwright.request.newContext({ baseURL: env.apiUrl });
    await use(new ApiHelper(request));
    await request.dispose();
  },
});

export { expect } from '@playwright/test';
