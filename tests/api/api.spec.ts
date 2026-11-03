import { ApiData } from '../../data/testData';
import { test } from '../../fixtures/base-fixture';

// API tests only use the api fixture, so no browser is opened at all
test.describe('API Posts', { tag: '@api' }, () => {
  test('Ambil detail post berdasarkan id', { tag: '@smoke' }, async ({ api }) => {
    await api.getPost(ApiData.existingPostId);
    api.expectStatus(200);
    await api.expectPostId(ApiData.existingPostId);
  });

  test('Membuat post baru', { tag: '@regression' }, async ({ api }) => {
    await api.createPost();
    api.expectStatus(201);
    await api.expectBodyMatchesSentPayload();
  });

  test('Menghapus post berdasarkan id', { tag: '@regression' }, async ({ api }) => {
    await api.deletePost(ApiData.existingPostId);
    api.expectStatus(200);
    await api.expectEmptyBody();
  });

  // jsonplaceholder does not store created posts, so the delete is only checked from its response
  test('Membuat post baru lalu menghapusnya', { tag: '@regression' }, async ({ api }) => {
    await api.createPost();
    api.expectStatus(201);
    const createdId = await api.getResponseId();
    await api.deletePost(createdId);
    api.expectStatus(200);
    await api.expectEmptyBody();
  });
});
