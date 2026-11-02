import { expect, Locator, Page, test } from '@playwright/test';

// Selenium: WebDriverExtensions (ClickWrapper, SendKeysWrapper, ControlDisplayed).
// Tiap fungsi dibungkus test.step, jadi muncul sebagai langkah bernama di HTML report dan trace.
// box: true = kalau gagal, error menunjuk ke baris di page yang memanggil, bukan ke file ini.
// Nama elemen diambil dari locator.describe('...') di constructor page, atau dari locator itu sendiri.
// Tidak ada sleep: expect dan aksi Playwright sudah menunggu otomatis sampai timeout.

// path relatif terhadap baseURL di playwright.config.ts
export async function openPage(page: Page, path: string): Promise<void> {
  await test.step(`Buka halaman ${path}`, async () => {
    await page.goto(path);
  }, { box: true });
}

export async function clickElement(locator: Locator): Promise<void> {
  await test.step(`Klik ${locator}`, async () => {
    await expect(locator, `${locator} harus tampil sebelum diklik`).toBeVisible();
    await locator.click();
  }, { box: true });
}

// secret: true = nilai tidak ditampilkan di report (password, token)
export async function fillElement(locator: Locator, value: string, options: { secret?: boolean } = {}): Promise<void> {
  const shown = options.secret ? '***' : `"${value}"`;
  await test.step(`Isi ${locator} dengan ${shown}`, async () => {
    await expect(locator, `${locator} harus tampil sebelum diisi`).toBeVisible();
    await locator.fill(value);
    // Selenium: SendKeysDateWrapper membaca ulang nilai; di sini dicek untuk semua input
    await expect(locator, `Nilai ${locator} tidak sesuai setelah diisi`).toHaveValue(value);
  }, { box: true });
}

export async function expectElementVisible(locator: Locator): Promise<void> {
  await test.step(`Pastikan ${locator} tampil`, async () => {
    await expect(locator, `${locator} tidak tampil`).toBeVisible();
  }, { box: true });
}

// Teks harus sama persis (spasi di awal/akhir diabaikan)
export async function expectElementText(locator: Locator, text: string): Promise<void> {
  await test.step(`Pastikan ${locator} bertuliskan "${text}"`, async () => {
    await expect(locator, `${locator} tidak tampil`).toBeVisible();
    await expect(locator).toHaveText(text);
  }, { box: true });
}

// Teks cukup mengandung nilai yang diharapkan (untuk pesan panjang seperti error)
export async function expectElementContainsText(locator: Locator, text: string): Promise<void> {
  await test.step(`Pastikan ${locator} berisi "${text}"`, async () => {
    await expect(locator, `${locator} tidak tampil`).toBeVisible();
    await expect(locator).toContainText(text);
  }, { box: true });
}

export async function expectUrlContains(page: Page, path: string): Promise<void> {
  await test.step(`Pastikan URL mengandung ${path}`, async () => {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(page).toHaveURL(new RegExp(escaped));
  }, { box: true });
}
