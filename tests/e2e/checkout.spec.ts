import { CheckoutData } from '../../data/testData';
import { test } from '../../fixtures/base-fixture';

test.describe('Checkout', { tag: '@checkout' }, () => {
  // Equivalent of the Reqnroll Background "saya sudah login". The session comes from the setup project
  // (storageState), so each test opens the product page directly without filling in the login form.
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('Checkout satu produk sampai selesai',
    { tag: '@smoke' }, async ({ homePage, cartPage, checkoutPage }) => {
    await homePage.addToCart(CheckoutData.product);
    await homePage.expectCartCount(1);
    await homePage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.submitCustomer();
    await checkoutPage.finish();
    await checkoutPage.expectOrderComplete();
  });

  test('Checkout gagal jika data pembeli kosong', { tag: ['@regression', '@negative'] }, async ({ homePage, cartPage, checkoutPage }) => {
    await homePage.addToCart(CheckoutData.otherProduct);
    await homePage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.continueWithoutCustomer();
    await checkoutPage.expectErrorMessage(CheckoutData.firstNameRequiredMessage);
  });

  // Customer data is fetched from the API by the apiCustomer fixture before the test starts
  test('Checkout dengan data pembeli dari API', { tag: '@regression' }, async ({ homePage, cartPage, checkoutPage, apiCustomer }) => {
    await homePage.addToCart(CheckoutData.product);
    await homePage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.submitCustomer(apiCustomer);
    await checkoutPage.finish();
    await checkoutPage.expectOrderComplete();
  });
});
