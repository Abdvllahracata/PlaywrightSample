import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Environment configuration for all tests.
 * Values are read from config/.env (the equivalent of local.runsettings in Reqnroll).
 * Set ENV=<name> to read config/.env.<name> instead, e.g. ENV=staging reads config/.env.staging.
 */
const envName = process.env.ENV ?? 'default';
const envFile = process.env.ENV ? `.env.${process.env.ENV}` : '.env';
dotenv.config({ path: path.resolve(__dirname, envFile), quiet: true });

/** Reads a required variable; execution stops with an error message when the value is empty. */
function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variabel "${key}" kosong. Cek file config/${envFile}`);
  return value;
}

/**
 * Reads an optional parameter with a default value.
 * Equivalent to TestContext.Parameters.Get<string>("X", "<default>") in Reqnroll.
 */
export function getParam(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Configuration values used by playwright.config.ts, fixtures, and test data.
 * name is the active environment (ENV, or default) and file holds the name of the active .env file.
 * appName is the application under test, shown in the email notification and the HTML report.
 * authFile is where the setup project saves the login session; it is kept separate per environment
 * because a session is only valid for the baseUrl it was created on.
 * baseUrl (UI application URL), apiUrl (API base URL), and the test account password are required.
 * headless=false shows the browser window, while slowMo adds a delay (ms) between actions so they can be
 * observed in headed mode.
 */
export const env = {
  name: envName,
  file: envFile,
  appName: getParam('APP_NAME', 'SauceDemo'),
  authFile: path.resolve(__dirname, `../.auth/${envName}.json`),
  baseUrl: required('BASE_URL'),
  apiUrl: required('API_URL'),
  password: required('USER_PASSWORD'),
  headless: getParam('HEADLESS', 'true') !== 'false',
  slowMo: Number(getParam('SLOW_MO', '0')),

  // Remote execution on Selenoid, equivalent to IsSelenoid, SeleniumRemote (url, format http://<host>:4444),
  // SeleniumUsername, SeleniumPassword, SeleniumBrowserVersion, and IsEnableVideo in local.runsettings.
  // enabled=true runs e2e browsers on Selenoid. The session closes automatically after sessionTimeout
  // without activity. enableVnc lets the browser be monitored from the Selenoid UI, while enableVideo
  // enables video recording on the Selenoid side. workers is the number of parallel Selenoid sessions; the server
  // closed browsers mid-test with 2 or more parallel sessions, so the default is 1.
  selenoid: {
    enabled: getParam('IS_SELENOID', 'false') === 'true',
    url: getParam('SELENOID_URL', ''),
    username: getParam('SELENOID_USERNAME', ''),
    password: getParam('SELENOID_PASSWORD', ''),
    chromeVersion: getParam('SELENOID_CHROME_VERSION', '125.0'),
    sessionTimeout: getParam('SELENOID_SESSION_TIMEOUT', '2m'),
    screenResolution: getParam('SELENOID_SCREEN_RESOLUTION', '1920x1080x24'),
    enableVnc: getParam('SELENOID_ENABLE_VNC', 'true') === 'true',
    enableVideo: getParam('IS_ENABLE_VIDEO', 'false') === 'true',
    workers: Number(getParam('SELENOID_WORKERS', '1')),
  },

  // Email notification sent by reporters/email-reporter.ts after a run. enabled=true sends the email (npm run
  // test:notify sets it), onlyOnFailure=true skips runs that pass, and dryRun=true saves a preview file instead
  // of sending. EMAIL_TO accepts several addresses separated by commas; from defaults to the SMTP user.
  // testType names the run (e.g. "Smoke Test"); when empty it is derived from the tags in --grep.
  // The default SMTP server is Gmail, which requires an App Password instead of the normal account password.
  email: {
    enabled: getParam('EMAIL_ENABLED', 'false') === 'true',
    testType: getParam('TEST_TYPE', ''),
    onlyOnFailure: getParam('EMAIL_ONLY_ON_FAILURE', 'false') === 'true',
    dryRun: getParam('EMAIL_DRY_RUN', 'false') === 'true',
    to: getParam('EMAIL_TO', ''),
    from: getParam('EMAIL_FROM', ''),
    smtp: {
      host: getParam('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(getParam('SMTP_PORT', '465')),
      user: getParam('SMTP_USER', ''),
      password: getParam('SMTP_PASSWORD', ''),
    },
  },
};
