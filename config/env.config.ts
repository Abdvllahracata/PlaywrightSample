import path from 'node:path';
import dotenv from 'dotenv';

// Selenium: config/.env = local.runsettings; file ini = TestContext.Parameters.Get<T>(nama, default)
// Opsional: ENV=staging membaca config/.env.staging (buat file itu kalau suatu saat butuh environment lain)
const envFile = process.env.ENV ? `.env.${process.env.ENV}` : '.env';
dotenv.config({ path: path.resolve(__dirname, envFile), quiet: true });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Variabel "${key}" kosong. Cek file config/${envFile}`);
  return value;
}

// Reqnroll: TestContext.Parameters.Get<string>("X", "<default>"); nilai bisa di-override lewat .env
export function getParam(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  file: envFile,
  baseUrl: required('BASE_URL'),
  apiUrl: required('API_URL'),
  password: required('USER_PASSWORD'),
  headless: getParam('HEADLESS', 'true') !== 'false',
  slowMo: Number(getParam('SLOW_MO', '0')), // jeda (ms) tiap aksi, supaya klik terlihat saat headed

  // runsettings: IsSelenoid, SeleniumRemote, SeleniumBrowserVersion, IsEnableVideo
  selenoid: {
    enabled: getParam('IS_SELENOID', 'false') === 'true',
    url: getParam('SELENOID_URL', ''), // http://<host>:4444 (= SeleniumRemote)
    username: getParam('SELENOID_USERNAME', ''), // = SeleniumUsername
    password: getParam('SELENOID_PASSWORD', ''), // = SeleniumPassword
    chromeVersion: getParam('SELENOID_CHROME_VERSION', '125.0'),
    sessionTimeout: getParam('SELENOID_SESSION_TIMEOUT', '2m'),
    screenResolution: getParam('SELENOID_SCREEN_RESOLUTION', '1920x1080x24'),
    enableVnc: getParam('SELENOID_ENABLE_VNC', 'true') === 'true',
    enableVideo: getParam('IS_ENABLE_VIDEO', 'false') === 'true',
  },
};
