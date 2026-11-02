import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { buildPost, PostPayload } from './dataFactory';

// API test tanpa browser; baseURL diatur di fixture (env.apiUrl).
// Satu instance per scenario, jadi response terakhir aman disimpan di sini (Reqnroll: ScenarioContext)
export class ApiHelper {
  private lastResponse?: APIResponse;
  private lastPayload?: PostPayload;

  constructor(private readonly request: APIRequestContext) {}

  private get response(): APIResponse {
    if (!this.lastResponse) throw new Error('Belum ada request yang dikirim di scenario ini');
    return this.lastResponse;
  }

  async getPost(id: number): Promise<void> {
    this.lastResponse = await this.request.get(`/posts/${id}`);
  }

  // Tanpa argumen = payload acak dari dataFactory
  async createPost(payload: PostPayload = buildPost()): Promise<void> {
    this.lastPayload = payload;
    this.lastResponse = await this.request.post('/posts', { data: payload });
  }

  expectStatus(status: number): void {
    expect(this.response.status()).toBe(status);
  }

  async expectPostId(id: number): Promise<void> {
    const body = await this.response.json();
    expect(body.id).toBe(id);
    expect(body.title).toBeTruthy();
  }

  async expectBodyMatchesSentPayload(): Promise<void> {
    const body = await this.response.json();
    expect(body).toMatchObject(this.lastPayload!);
    expect(body.id).toBeDefined();
  }
}
