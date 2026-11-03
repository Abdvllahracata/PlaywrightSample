import { Locator, Page } from '@playwright/test';
import { LoginData } from '../data/testData';
import { clickElement, expectElementContainsText, expectElementVisible, fillElement, openPage } from '../utils/elementHelper';

/** Login page (/). */
export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    // describe() gives each element a name in the report; the data-test attribute is set through testIdAttribute in the config
    this.usernameInput = page.getByTestId('username').describe('Input username');
    this.passwordInput = page.getByTestId('password').describe('Input password');
    this.loginButton = page.getByTestId('login-button').describe('Tombol Login');
    this.errorMessage = page.getByTestId('error').describe('Pesan error login');
  }

  /** Opens the login page and ensures the form is ready to use. */
  async goto(): Promise<void> {
    await openPage(this.page, '/');
    await expectElementVisible(this.loginButton);
  }

  /** Logs in with the given username; without a password argument, the valid password from .env is used. */
  async login(username: string, password: string = LoginData.password): Promise<void> {
    await fillElement(this.usernameInput, username);
    await fillElement(this.passwordInput, password, { secret: true });
    await clickElement(this.loginButton);
  }

  /** Opens the login page and logs in; without an argument, the valid user is used. */
  async openAndLogin(username: string = LoginData.validUser): Promise<void> {
    await this.goto();
    await this.login(username);
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expectElementContainsText(this.errorMessage, message);
  }
}
