import { env } from '../config/env.config';
import { ApiData } from '../data/testData';
import { test as base } from './browser-fixture';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { ApiHelper } from '../utils/apiHelper';
import { Customer } from '../data/dataFactory';

type Fixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  api: ApiHelper;
  apiCustomer: Customer;
  apiNewCustomer: Customer;
};

/**
 * Page object and API client fixtures (the equivalent of Hooks.cs, BasePages, and BasePagesHelper).
 * The base fixture comes from browser-fixture, which uses a local browser, or a browser on Selenoid when IS_SELENOID=true.
 * Code before use() acts as setup ([BeforeScenario]); code after it acts as teardown ([AfterScenario]).
 * The browser and page are opened and closed automatically by Playwright, only when a page fixture is used.
 * apiCustomer provides checkout customer data fetched from the API (ApiData.customerUserId) before the test starts.
 * apiNewCustomer creates a new customer through the API before the test and deletes it through the API afterwards,
 * also when the test fails, so every test cleans up the data it prepared.
 * All tests import { test, expect } from this file, not from '@playwright/test'.
 */
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
  apiCustomer: async ({ api }, use) => {
    await use(await api.fetchCustomer(ApiData.customerUserId));
  },
  apiNewCustomer: async ({ api }, use) => {
    const { id, ...customer } = await api.createCustomer();
    await use(customer);
    await api.deleteCustomer(id);
  },
});

export { expect } from '@playwright/test';
