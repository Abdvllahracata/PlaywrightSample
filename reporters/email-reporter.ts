import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import type { FullConfig, FullResult, Reporter, Suite, TestCase } from '@playwright/test/reporter';
import { env } from '../config/env.config';

type Counts = { passed: number; failed: number; flaky: number; skipped: number };
type Failure = { project: string; title: string; error: string };
type Summary = Counts & { total: number; projects: Map<string, Counts>; failures: Failure[] };

const previewFile = path.resolve(__dirname, '../test-results/email-preview.html');

/**
 * Sends a summary email after the whole run finishes: application, test type, status, passed/failed/flaky/skipped
 * counts, duration, environment, a per-project breakdown, and the failed tests with their first error line.
 * The subject reads like "[SauceDemo] Smoke Test - PASSED 6/6 - default".
 * It is disabled by default; run npm run test:notify or set EMAIL_ENABLED=true. EMAIL_ONLY_ON_FAILURE=true sends
 * only when the run does not pass, and EMAIL_DRY_RUN=true saves the email to test-results/email-preview.html
 * instead of sending it. Delivery problems are logged but never change the test result.
 */
export default class EmailReporter implements Reporter {
  private rootSuite?: Suite;
  private startTime = new Date();
  private testType = '';

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootSuite = suite;
    this.startTime = new Date();
    this.testType = env.email.testType || detectTestType(config);
  }

  async onEnd(result: FullResult): Promise<void> {
    const { email } = env;
    if (!email.enabled && !email.dryRun) return;
    if (email.onlyOnFailure && result.status === 'passed') return;

    const summary = summarize(this.rootSuite?.allTests() ?? []);
    const subject = `[${env.appName}] ${this.testType} - ${result.status.toUpperCase()} ${summary.passed + summary.flaky}/${summary.total} - ${env.name}`;
    const html = renderHtml(result, summary, this.startTime, this.testType);

    try {
      if (email.dryRun) {
        fs.mkdirSync(path.dirname(previewFile), { recursive: true });
        fs.writeFileSync(previewFile, `<!-- Subject: ${escapeHtml(subject)} -->\n${html}`);
        console.log(`Preview email disimpan di ${previewFile}`);
        return;
      }
      if (!email.to || !email.smtp.user || !email.smtp.password) {
        console.warn(`Notifikasi email dilewati: EMAIL_TO, SMTP_USER, atau SMTP_PASSWORD kosong di config/${env.file}`);
        return;
      }
      const transporter = nodemailer.createTransport({
        host: email.smtp.host,
        port: email.smtp.port,
        secure: email.smtp.port === 465,
        auth: { user: email.smtp.user, pass: email.smtp.password },
      });
      await transporter.sendMail({ from: email.from || email.smtp.user, to: email.to, subject, html });
      console.log(`Notifikasi email dikirim ke ${email.to}`);
    } catch (error) {
      console.error(`Gagal mengirim notifikasi email: ${(error as Error).message}`);
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}

/**
 * Names the run after the tags in --grep: @smoke gives "Smoke Test", @smoke|@regression gives
 * "Smoke + Regression Test", and a run without a tag filter is a "Full Test".
 * The command line --grep is read from process.argv because Playwright does not pass it to config.grep;
 * grep set in playwright.config.ts is read from the config.
 */
function detectTestType(config: FullConfig): string {
  const argv = process.argv;
  const cliGreps = argv.flatMap((arg, i) =>
    arg === '--grep' || arg === '-g' ? [argv[i + 1] ?? ''] : arg.startsWith('--grep=') ? [arg.slice('--grep='.length)] : [],
  );
  const configGreps = [config.grep, ...config.projects.map((p) => p.grep)].flat().map((grep) => grep.source);
  const tags = new Set([...cliGreps, ...configGreps].flatMap((source) => source.match(/@[\w-]+/g) ?? []));
  const names = [...tags].map((tag) => tag.charAt(1).toUpperCase() + tag.slice(2));
  return names.length ? `${names.join(' + ')} Test` : 'Full Test';
}

/** Counts every test by its final outcome, overall and per project, and collects the failed tests. */
function summarize(tests: TestCase[]): Summary {
  const summary: Summary = { total: tests.length, passed: 0, failed: 0, flaky: 0, skipped: 0, projects: new Map(), failures: [] };
  for (const test of tests) {
    const project = test.parent.project()?.name ?? '-';
    const counts = summary.projects.get(project) ?? { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    const key = ({ expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' } as const)[test.outcome()];
    counts[key]++;
    summary[key]++;
    summary.projects.set(project, counts);
    if (key === 'failed') {
      const lastError = test.results.at(-1)?.error?.message ?? '';
      summary.failures.push({ project, title: test.titlePath().slice(3).join(' › '), error: firstLine(lastError) });
    }
  }
  return summary;
}

/** Builds the email body with inline styles, since most email clients ignore stylesheets. */
function renderHtml(result: FullResult, summary: Summary, startTime: Date, testType: string): string {
  const color = result.status === 'passed' ? '#1a7f37' : '#cf222e';
  const cell = 'padding:6px 12px;border:1px solid #d0d7de;text-align:left;';
  const projectRows = [...summary.projects]
    .map(([name, c]) => `<tr><td style="${cell}">${escapeHtml(name)}</td><td style="${cell}">${c.passed}</td><td style="${cell}">${c.failed}</td><td style="${cell}">${c.flaky}</td><td style="${cell}">${c.skipped}</td></tr>`)
    .join('');
  const failureRows = summary.failures
    .map((f) => `<tr><td style="${cell}">${escapeHtml(f.project)}</td><td style="${cell}">${escapeHtml(f.title)}</td><td style="${cell}font-family:monospace;">${escapeHtml(f.error)}</td></tr>`)
    .join('');

  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1f2328;">
  <h2 style="margin:0 0 12px;color:${color};">${escapeHtml(env.appName)} - ${escapeHtml(testType)}: ${result.status.toUpperCase()}</h2>
  <table style="border-collapse:collapse;margin-bottom:16px;">
    <tr><th style="${cell}">Aplikasi</th><td style="${cell}">${escapeHtml(env.appName)}</td></tr>
    <tr><th style="${cell}">Tipe test</th><td style="${cell}">${escapeHtml(testType)}</td></tr>
    <tr><th style="${cell}">Environment</th><td style="${cell}">${escapeHtml(env.name)} (${escapeHtml(env.baseUrl)})</td></tr>
    <tr><th style="${cell}">Mulai</th><td style="${cell}">${startTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td></tr>
    <tr><th style="${cell}">Durasi</th><td style="${cell}">${formatDuration(result.duration)}</td></tr>
    <tr><th style="${cell}">Total</th><td style="${cell}">${summary.total} test: ${summary.passed} passed, ${summary.failed} failed, ${summary.flaky} flaky, ${summary.skipped} skipped</td></tr>
  </table>
  <h3 style="margin:0 0 8px;">Per project</h3>
  <table style="border-collapse:collapse;margin-bottom:16px;">
    <tr><th style="${cell}">Project</th><th style="${cell}">Passed</th><th style="${cell}">Failed</th><th style="${cell}">Flaky</th><th style="${cell}">Skipped</th></tr>
    ${projectRows}
  </table>
  ${summary.failures.length ? `<h3 style="margin:0 0 8px;color:#cf222e;">Test yang gagal</h3>
  <table style="border-collapse:collapse;margin-bottom:16px;">
    <tr><th style="${cell}">Project</th><th style="${cell}">Test</th><th style="${cell}">Error</th></tr>
    ${failureRows}
  </table>` : ''}
  <p style="color:#59636e;">Detail lengkap (langkah, screenshot, trace): jalankan <code>npm run report</code> di mesin yang menjalankan test.</p>
</div>`;
}

/** Takes the first meaningful line of an error message without terminal color codes. */
function firstLine(message: string): string {
  return message.replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((line) => line.trim()) ?? '';
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
