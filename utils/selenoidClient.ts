import { APIRequest, APIRequestContext } from '@playwright/test';
import { env } from '../config/env.config';

/**
 * Selenoid session client (the equivalent of Drivers/Browsers.cs).
 * The WebDriver session on Selenoid (through Ggr) is only used to obtain a browser; after that,
 * Playwright controls the browser through CDP at /devtools/<sessionId>. Only Chrome-family browsers are supported.
 */

/** Browser requested from Selenoid; browserName follows Selenoid naming, e.g. chrome or MicrosoftEdge. */
export type RemoteBrowser = {
  browserName: string;
  browserVersion: string;
};

export class SelenoidSession {
  private keepAliveTimer?: NodeJS.Timeout;
  private pendingPing?: Promise<unknown>;

  private constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    readonly headers: Record<string, string>,
    readonly sessionId: string,
  ) {}

  /**
   * Creates a new session on Selenoid.
   * apiRequest: playwright.request from the fixture; sessionName: the session name shown in the Selenoid UI.
   */
  static async create(apiRequest: APIRequest, browser: RemoteBrowser, sessionName: string): Promise<SelenoidSession> {
    const { baseUrl, headers } = parseRemoteUrl(env.selenoid.url);
    const request = await apiRequest.newContext({ baseURL: baseUrl, extraHTTPHeaders: headers });
    const response = await request.post('/wd/hub/session', {
      failOnStatusCode: false,
      timeout: 60_000,
      data: {
        capabilities: {
          alwaysMatch: {
            ...browser,
            'selenoid:options': {
              name: sessionName,
              enableVNC: env.selenoid.enableVnc,
              enableVideo: env.selenoid.enableVideo,
              sessionTimeout: env.selenoid.sessionTimeout,
              screenResolution: env.selenoid.screenResolution,
              timeZone: 'Asia/Jakarta',
            },
          },
        },
      },
    });
    const body = await response.json().catch(() => ({}));
    const sessionId: string | undefined = body?.value?.sessionId;
    if (!response.ok() || !sessionId) {
      await request.dispose();
      const message = body?.value?.message ?? JSON.stringify(body);
      throw new Error(`Gagal membuat sesi Selenoid ${browser.browserName} ${browser.browserVersion}: HTTP ${response.status()} ${message}`);
    }
    const session = new SelenoidSession(request, baseUrl, headers, sessionId);
    session.startKeepAlive();
    return session;
  }

  /** CDP WebSocket URL for chromium.connectOverCDP. */
  get cdpUrl(): string {
    return `${this.baseUrl.replace(/^http/, 'ws')}/devtools/${this.sessionId}`;
  }

  /** Stops the keep-alive, then closes the session; errors are ignored because the session may already be closed. */
  async delete(): Promise<void> {
    clearInterval(this.keepAliveTimer);
    await this.pendingPing;
    await this.request.delete(`/wd/hub/session/${this.sessionId}`, { failOnStatusCode: false }).catch(() => {});
    await this.request.dispose();
  }

  /**
   * Selenoid closes a session when no WebDriver command is received within sessionTimeout, and CDP traffic is not counted.
   * Therefore, a lightweight read command is sent every half of sessionTimeout.
   * If the process stops, the pings stop as well and the session closes automatically.
   */
  private startKeepAlive(): void {
    const interval = Math.max(durationToMs(env.selenoid.sessionTimeout) / 2, 5_000);
    this.keepAliveTimer = setInterval(() => {
      this.pendingPing = this.request
        .get(`/wd/hub/session/${this.sessionId}/url`, { failOnStatusCode: false })
        .catch(() => {});
    }, interval);
  }
}

/** Extracts the base URL and converts SELENOID_USERNAME/PASSWORD into a Basic auth header (empty = no authentication). */
function parseRemoteUrl(remoteUrl: string): { baseUrl: string; headers: Record<string, string> } {
  if (!remoteUrl) throw new Error('SELENOID_URL kosong. Isi di config/.env atau set IS_SELENOID=false');
  const url = new URL(remoteUrl);
  const headers: Record<string, string> = {};
  const { username, password } = env.selenoid;
  if (username) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }
  return { baseUrl: `${url.protocol}//${url.host}`, headers };
}

/** Converts a Selenoid duration (30s, 2m, 1h) to milliseconds. */
function durationToMs(duration: string): number {
  const match = /^(\d+)(s|m|h)$/.exec(duration.trim());
  if (!match) throw new Error(`SELENOID_SESSION_TIMEOUT "${duration}" tidak valid, contoh: 30s, 2m`);
  const unit = { s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as 's' | 'm' | 'h'];
  return Number(match[1]) * unit;
}
