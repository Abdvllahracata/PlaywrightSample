import { ApiData } from '../../data/testDataSource';
import { test } from '../../fixtures/base-fixture';

// API test: hanya pakai fixture api, jadi browser tidak dibuka sama sekali
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
});
