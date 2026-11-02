import { Locator, Page } from '@playwright/test';
import { HomeData } from '../data/testDataSource';
import { clickElement, expectElementText, expectUrlContains } from '../utils/elementHelper';

// Halaman produk (home setelah login, URL /inventory.html)
export class HomePage {
  readonly title: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title').describe('Judul halaman produk');
    this.cartLink = page.getByTestId('shopping-cart-link').describe('Ikon keranjang');
    this.cartBadge = page.getByTestId('shopping-cart-badge').describe('Jumlah item keranjang');
  }

  // Selenium: By.XPath($"//div[...='{nama}']//button"); di sini filter kartu produk berdasarkan teks
  private addToCartButton(productName: string): Locator {
    return this.page
      .getByTestId('inventory-item')
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Add to cart' })
      .describe(`Tombol Add to cart "${productName}"`);
  }

  async addToCart(productName: string): Promise<void> {
    await clickElement(this.addToCartButton(productName));
  }

  async openCart(): Promise<void> {
    await clickElement(this.cartLink);
  }

  async expectLoaded(): Promise<void> {
    await expectUrlContains(this.page, HomeData.path);
    await expectElementText(this.title, HomeData.title);
  }

  async expectCartCount(count: number): Promise<void> {
    await expectElementText(this.cartBadge, String(count));
  }
}
