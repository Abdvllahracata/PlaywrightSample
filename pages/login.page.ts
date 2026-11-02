import { Locator, Page } from '@playwright/test';
import { LoginData } from '../data/testDataSource';
import { clickElement, expectElementContainsText, expectElementVisible, fillElement, openPage } from '../utils/elementHelper';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    // describe() = nama elemen yang tampil di report; data-test diatur di config (testIdAttribute)
    this.usernameInput = page.getByTestId('username').describe('Input username');
    this.passwordInput = page.getByTestId('password').describe('Input password');
    this.loginButton = page.getByTestId('login-button').describe('Tombol Login');
    this.errorMessage = page.getByTestId('error').describe('Pesan error login');
  }

  async goto(): Promise<void> {
    await openPage(this.page, '/');
    await expectElementVisible(this.loginButton);
  }

  // Tanpa password = password valid dari .env
  async login(username: string, password: string = LoginData.password): Promise<void> {
    await fillElement(this.usernameInput, username);
    await fillElement(this.passwordInput, password, { secret: true });
    await clickElement(this.loginButton);
  }

  // Tanpa argumen = login sebagai user valid
  async openAndLogin(username: string = LoginData.validUser): Promise<void> {
    await this.goto();
    await this.login(username);
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expectElementContainsText(this.errorMessage, message);
  }
}
