import { Locator, Page } from '@playwright/test';
import { CheckoutData } from '../data/testDataSource';
import { buildCustomer, Customer } from '../utils/dataFactory';
import { clickElement, expectElementContainsText, expectElementText, fillElement } from '../utils/elementHelper';

// Checkout: step 1 (data pembeli), step 2 (ringkasan), complete
export class CheckoutPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput = page.getByTestId('firstName').describe('Input First Name');
    this.lastNameInput = page.getByTestId('lastName').describe('Input Last Name');
    this.postalCodeInput = page.getByTestId('postalCode').describe('Input Postal Code');
    this.continueButton = page.getByTestId('continue').describe('Tombol Continue');
    this.finishButton = page.getByTestId('finish').describe('Tombol Finish');
    this.completeHeader = page.getByTestId('complete-header').describe('Judul pesanan selesai');
    this.errorMessage = page.getByTestId('error').describe('Pesan error checkout');
  }

  // Tanpa argumen = data pembeli acak dari dataFactory
  async submitCustomer(customer: Customer = buildCustomer()): Promise<void> {
    await fillElement(this.firstNameInput, customer.firstName);
    await fillElement(this.lastNameInput, customer.lastName);
    await fillElement(this.postalCodeInput, customer.postalCode);
    await clickElement(this.continueButton);
  }

  async continueWithoutCustomer(): Promise<void> {
    await clickElement(this.continueButton);
  }

  async finish(): Promise<void> {
    await clickElement(this.finishButton);
  }

  async expectOrderComplete(): Promise<void> {
    await expectElementText(this.completeHeader, CheckoutData.successMessage);
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expectElementContainsText(this.errorMessage, message);
  }
}
