import { expect, Locator, Page, test } from '@playwright/test';

/**
 * Element action and assertion wrappers (the equivalent of WebDriverExtensions: ClickWrapper, SendKeysWrapper, ControlDisplayed).
 * - Each function is wrapped in test.step, so it appears as a named step in the HTML report and trace.
 * - box: true makes errors point to the calling line in the page, not to this file.
 * - Element names are taken from locator.describe('...') in the page constructor, or from the locator itself.
 * - No sleep is needed: Playwright actions and expect wait automatically until the timeout.
 */

/** Opens a page; the path is relative to baseURL in playwright.config.ts. */
export async function openPage(page: Page, path: string): Promise<void> {
  await test.step(`Buka halaman ${path}`, async () => {
    await page.goto(path);
  }, { box: true });
}

/** Ensures the element is visible, then clicks it. */
export async function clickElement(locator: Locator): Promise<void> {
  await test.step(`Klik ${locator}`, async () => {
    await expect(locator, `${locator} harus tampil sebelum diklik`).toBeVisible();
    await locator.click();
  }, { box: true });
}

/** Fills an input and verifies its value; secret: true hides the value in the report (password, token). */
export async function fillElement(locator: Locator, value: string, options: { secret?: boolean } = {}): Promise<void> {
  const shown = options.secret ? '***' : `"${value}"`;
  await test.step(`Isi ${locator} dengan ${shown}`, async () => {
    await expect(locator, `${locator} harus tampil sebelum diisi`).toBeVisible();
    await locator.fill(value);
    // The value is read back to ensure the input was stored (the equivalent of SendKeysDateWrapper, applied to all inputs)
    await expect(locator, `Nilai ${locator} tidak sesuai setelah diisi`).toHaveValue(value);
  }, { box: true });
}

export async function expectElementVisible(locator: Locator): Promise<void> {
  await test.step(`Pastikan ${locator} tampil`, async () => {
    await expect(locator, `${locator} tidak tampil`).toBeVisible();
  }, { box: true });
}

/**
 * The element text must match exactly; leading and trailing whitespace is ignored.
 * With a list, the locator must match exactly that many elements with those texts, in order.
 */
export async function expectElementText(locator: Locator, text: string | string[]): Promise<void> {
  await test.step(`Pastikan ${locator} bertuliskan "${[text].flat().join('", "')}"`, async () => {
    await expect(locator.first(), `${locator} tidak tampil`).toBeVisible();
    await expect(locator).toHaveText(text);
  }, { box: true });
}

/** The element text only needs to contain the expected value (for long messages, such as error messages). */
export async function expectElementContainsText(locator: Locator, text: string): Promise<void> {
  await test.step(`Pastikan ${locator} berisi "${text}"`, async () => {
    await expect(locator, `${locator} tidak tampil`).toBeVisible();
    await expect(locator).toContainText(text);
  }, { box: true });
}

/** The page URL must contain the given path. */
export async function expectUrlContains(page: Page, path: string): Promise<void> {
  await test.step(`Pastikan URL mengandung ${path}`, async () => {
    // Special regex characters (such as dots) are escaped so they are matched as plain text
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page).toHaveURL(new RegExp(escaped));
  }, { box: true });
}
