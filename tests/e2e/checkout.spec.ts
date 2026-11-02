import { CheckoutData } from '../../data/testDataSource';
import { test } from '../../fixtures/base-fixture';

test.describe('Checkout', { tag: '@checkout' }, () => {
  // Reqnroll: Background "saya sudah login"
  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.openAndLogin();
    await homePage.expectLoaded();
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
});
