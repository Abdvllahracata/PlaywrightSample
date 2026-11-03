import { CheckoutData } from '../../data/testData';
import { test } from '../../fixtures/base-fixture';

// Tests that combine the API and the UI: data prepared through the API is used in the UI, and data produced
// in the UI is sent to the API. saucedemo has no API of its own, so the API side uses jsonplaceholder, which
// echoes created data but does not store it.
test.describe('Kombinasi API dan UI', { tag: '@hybrid' }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  // API -> UI: the apiNewCustomer fixture creates the customer through the API before the test and deletes it afterwards
  test('Tambah pembeli lewat API lalu checkout di UI', { tag: '@regression' }, async ({ homePage, cartPage, checkoutPage, apiNewCustomer }) => {
    await homePage.addToCart(CheckoutData.product);
    await homePage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.submitCustomer(apiNewCustomer);
    await checkoutPage.finish();
    await checkoutPage.expectOrderComplete();
  });

  // UI -> API: products added in the UI are saved through the API, then the saved record is deleted
  test('Tambah produk di UI lalu simpan dan hapus pesanan lewat API', { tag: '@regression' }, async ({ homePage, cartPage, api }) => {
    await homePage.addToCart(CheckoutData.product);
    await homePage.addToCart(CheckoutData.otherProduct);
    await homePage.expectCartCount(2);
    await homePage.openCart();
    await cartPage.expectItems([CheckoutData.product, CheckoutData.otherProduct]);

    const orderId = await api.createOrder(await cartPage.getItems());
    await api.deletePost(orderId);
    api.expectStatus(200);
    await api.expectEmptyBody();
  });

  // UI delete -> API: a product removed in the UI must not be sent to the API
  test('Hapus produk di UI lalu simpan sisa keranjang lewat API', { tag: '@regression' }, async ({ homePage, cartPage, api }) => {
    await homePage.addToCart(CheckoutData.product);
    await homePage.addToCart(CheckoutData.otherProduct);
    await homePage.openCart();
    await cartPage.removeItem(CheckoutData.otherProduct);
    await cartPage.expectItems([CheckoutData.product]);

    const orderId = await api.createOrder(await cartPage.getItems());
    await api.deletePost(orderId);
    api.expectStatus(200);
  });
});
