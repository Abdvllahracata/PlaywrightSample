import { Locator, Page } from '@playwright/test';
import { HomeData } from '../data/testData';
import { clickElement, expectElementText, expectUrlContains, openPage } from '../utils/elementHelper';

/** Product list page shown after login (/inventory.html). */
export class HomePage {
  readonly title: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title').describe('Judul halaman produk');
    this.cartLink = page.getByTestId('shopping-cart-link').describe('Ikon keranjang');
    this.cartBadge = page.getByTestId('shopping-cart-badge').describe('Jumlah item keranjang');
  }

  /** Dynamic locator: product cards are filtered by name (the equivalent of a parameterized By.XPath in Selenium). */
  private addToCartButton(productName: string): Locator {
    return this.page
      .getByTestId('inventory-item')
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Add to cart' })
      .describe(`Tombol Add to cart "${productName}"`);
  }

  /** Opens the product page directly; requires a logged-in session from storageState. */
  async goto(): Promise<void> {
    await openPage(this.page, HomeData.path);
    await this.expectLoaded();
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
