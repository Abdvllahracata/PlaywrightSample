import { Locator, Page } from '@playwright/test';
import { CartItem } from '../data/dataFactory';
import { clickElement, expectElementText, expectElementVisible } from '../utils/elementHelper';

/** Shopping cart page (/cart.html). */
export class CartPage {
  readonly items: Locator;
  readonly firstItem: Locator;
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item').describe('Item di keranjang');
    this.firstItem = this.items.first().describe('Item pertama di keranjang');
    this.itemNames = this.items.getByTestId('inventory-item-name').describe('Nama produk di keranjang');
    this.checkoutButton = page.getByTestId('checkout').describe('Tombol Checkout');
  }

  /** Dynamic locator: the Remove button of the cart row with the given product name. */
  private removeButton(productName: string): Locator {
    return this.items
      .filter({ hasText: productName })
      .getByRole('button', { name: 'Remove' })
      .describe(`Tombol Remove "${productName}"`);
  }

  /** Ensures the cart is not empty, then clicks the Checkout button. */
  async proceedToCheckout(): Promise<void> {
    await expectElementVisible(this.firstItem);
    await clickElement(this.checkoutButton);
  }

  async removeItem(productName: string): Promise<void> {
    await clickElement(this.removeButton(productName));
  }

  /** Reads the name and price of every product in the cart, e.g. to send them to the API. */
  async getItems(): Promise<CartItem[]> {
    await expectElementVisible(this.firstItem);
    return Promise.all(
      (await this.items.all()).map(async (item) => ({
        name: await item.getByTestId('inventory-item-name').innerText(),
        price: await item.getByTestId('inventory-item-price').innerText(),
      })),
    );
  }

  /** The cart must contain exactly these products, in this order. */
  async expectItems(productNames: string[]): Promise<void> {
    await expectElementText(this.itemNames, productNames);
  }
}
