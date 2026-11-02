import { Locator, Page } from '@playwright/test';
import { clickElement, expectElementVisible } from '../utils/elementHelper';

export class CartPage {
  readonly firstItem: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.firstItem = page.getByTestId('inventory-item').first().describe('Item pertama di keranjang');
    this.checkoutButton = page.getByTestId('checkout').describe('Tombol Checkout');
  }

  // Pastikan keranjang tidak kosong sebelum klik Checkout
  async proceedToCheckout(): Promise<void> {
    await expectElementVisible(this.firstItem);
    await clickElement(this.checkoutButton);
  }
}
