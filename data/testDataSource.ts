import { env, getParam } from '../config/env.config';

// Reqnroll: TestData/TestDataSource.cs. Semua data statis test ada di sini, dikelompokkan per fitur
// (pengganti prefix Login..., Checkout...). Test dan page dilarang hardcode nilai; ambil dari file ini.
// Data acak per test ada di utils/dataFactory.ts.

export const LoginData = {
  validUser: getParam('LOGIN_VALID_USER', 'standard_user'),
  lockedUser: getParam('LOGIN_LOCKED_USER', 'locked_out_user'),
  password: env.password,
  invalidPassword: 'password_salah',
  invalidCredentialMessage: 'Username and password do not match any user in this service',
  lockedOutMessage: 'Sorry, this user has been locked out.',
};

// Data-driven login gagal (Reqnroll: Examples di Scenario Outline)
export const InvalidLoginCases = [
  {
    kasus: 'password salah',
    username: LoginData.validUser,
    password: LoginData.invalidPassword,
    message: LoginData.invalidCredentialMessage,
  },
  {
    kasus: 'user terkunci',
    username: LoginData.lockedUser,
    password: LoginData.password,
    message: LoginData.lockedOutMessage,
  },
];

export const HomeData = {
  path: '/inventory.html',
  title: 'Products',
};

export const CheckoutData = {
  product: 'Sauce Labs Backpack',
  otherProduct: 'Sauce Labs Bike Light',
  successMessage: 'Thank you for your order!',
  firstNameRequiredMessage: 'First Name is required',
};

export const ApiData = {
  existingPostId: 1,
};
