# Playwright + TypeScript Framework

Framework latihan (poin 1–5 dari roadmap). AUT: saucedemo.com (UI) dan jsonplaceholder.typicode.com (API).

## Setup

```powershell
npm install
copy config\.env.example config\.env   # lalu isi nilainya (= local.runsettings)
```

Browser: test e2e memakai **Google Chrome dan Microsoft Edge yang terinstall di PC** (`channel` di config),
jadi tidak perlu `npx playwright install`. Di mesin tanpa Chrome/Edge (mis. agent CI):

```powershell
npx playwright install chrome msedge
```

## Menjalankan test

| Perintah | Fungsi |
|---|---|
| `npm test` | Semua project: `api` sekali + e2e di `chrome` dan `edge` |
| `npm run test:chrome` / `npm run test:edge` | e2e di satu browser saja |
| `npm run test:smoke` | Hanya tag `@smoke` |
| `npm run test:regression` | Hanya tag `@regression` |
| `npm run test:e2e` / `npm run test:api` | Hanya UI (chrome + edge) / hanya API |
| `npx playwright test --project=chrome -g "Login berhasil"` | Satu test di satu browser |
| `npm run test:headed` | Browser terlihat |
| `npm run test:ui` | UI mode: pilih test, lihat tiap langkah |
| `npm run test:debug` | Debugger langkah demi langkah |
| `npm run report` | Buka HTML report terakhir |
| `npm run typecheck` | Cek error TypeScript |
| `npx playwright test -g "Login berhasil"` | Satu test berdasarkan judul |
| `$env:ENV='staging'; npm test` | Opsional: baca `config/.env.staging` alih-alih `config/.env` (buat filenya dulu) |
| `HEADLESS=false` di `config/.env` | Tampilkan browser tanpa ubah kode (atau `npm run test:headed`) |
| `npm run test:selenoid` | Jalankan di server Selenoid (api + chrome), lihat bagian Selenoid di bawah |

## Menjalankan di Selenoid (remote)

Padanan `IsSelenoid=true` di `local.runsettings`. Isi di `config/.env` (lihat `.env.example`):

```
IS_SELENOID=false                                   # true = selalu remote; atau pakai npm run test:selenoid
SELENOID_URL=http://<host>:4444                     # = SeleniumRemote
SELENOID_USERNAME=<user>                            # = SeleniumUsername
SELENOID_PASSWORD=<password>                        # = SeleniumPassword
SELENOID_CHROME_VERSION=125.0                       # = SeleniumBrowserVersion
SELENOID_SESSION_TIMEOUT=2m
IS_ENABLE_VIDEO=false                               # video di Selenoid (video/trace Playwright tetap jalan)
```

Cara kerja (`fixtures/browser-fixture.ts` + `utils/selenoidClient.ts`):
1. Per worker dibuat satu sesi WebDriver di Selenoid (nama `Playwright <project> - worker <n>` di UI Selenoid, VNC aktif).
2. Playwright tersambung ke browser itu lewat CDP (`/devtools/<sessionId>`). Tiap test tetap dapat context baru.
3. Selama sesi hidup dikirim ping WebDriver tiap ½ `sessionTimeout`, karena trafik CDP tidak dihitung Selenoid.
4. Setelah worker selesai (lulus/gagal) sesi di-DELETE. Kalau proses dimatikan paksa, ping berhenti dan Selenoid menutup sesi setelah `sessionTimeout`.

Batasan: hanya Chrome (Edge di server tidak tersedia, Firefox tidak didukung CDP). Satu sesi Selenoid berisi beberapa test (per worker),
jadi untuk melihat satu test pakai video/trace Playwright di HTML report, bukan video Selenoid.
Page object, test, dan helper tidak berubah sama sekali antara lokal dan Selenoid.

## Struktur

```
tests/
  e2e/           Test UI (*.spec.ts)
  api/           Test API (*.spec.ts)
pages/           Page Object: locator + aksi + assertion (expect...)
fixtures/        browser-fixture.ts: browser lokal / Selenoid; base-fixture.ts: inject page object & API client
utils/           elementHelper (open/click/fill/expect...), dataFactory, apiHelper, selenoidClient, helpers
data/            testDataSource.ts: semua data statis per fitur (LoginData, CheckoutData, ...)
config/          .env (nilai, = local.runsettings) + .env.example (contoh) + env.config.ts (pembaca)
playwright.config.ts
```

## Aturan penulisan

- Test **selalu** import `test` dari `fixtures/base-fixture`, bukan dari `@playwright/test`.
- Isi test hanya memanggil fungsi page. Logika, pengambilan data, dan assertion ada di page:
  aksi diberi nama kata kerja (`login`, `addToCart`), assertion diberi awalan `expect` (`expectLoaded`, `expectErrorMessage`).
- Di page **tidak ada** `expect`/`click`/`fill` langsung; semua lewat `utils/elementHelper.ts`
  (`openPage`, `clickElement`, `fillElement`, `expectElementVisible`, `expectElementText`, `expectElementContainsText`, `expectUrlContains`).
  Pola yang dipakai di lebih dari satu page dijadikan fungsi baru di helper ini.
  Beri nama elemen dengan `.describe('...')` supaya terbaca di report.
- **Tidak ada nilai hardcode** di test maupun page: data statis dari `data/testDataSource.ts`, data acak dari `utils/dataFactory.ts`.
  Nilai di testDataSource bisa di-override lewat `.env` dengan `getParam('KEY', 'default')`.
- Parameter default membuat test lebih ringkas: `loginPage.openAndLogin()` = login user valid, `checkoutPage.submitCustomer()` = data acak.
- Locator: `getByRole` / `getByLabel` / `getByTestId` (atribut `data-test`, diatur di config). Hindari XPath.
- **Selalu `await`** setiap aksi dan `expect`. Kalau lupa, test bisa lulus padahal langkahnya belum jalan.
- Tidak ada `waitForTimeout` / sleep. Pakai `expect(...)`, yang otomatis retry sampai timeout.
- Setiap test harus independen (tidak bergantung urutan atau hasil test lain), karena test jalan paralel.
- Tag di opsi test: `{ tag: '@smoke' }` atau `{ tag: ['@regression', '@negative'] }`.
- Tambah page baru: buat di `pages/`, lalu daftarkan di `fixtures/base-fixture.ts`.

## Padanan dengan template Reqnroll + Selenium

| Reqnroll / Selenium | Di sini |
|---|---|
| `Feature` | `test.describe('...')` |
| `Scenario` | `test('...')` |
| `Background` | `test.beforeEach` |
| `Scenario Outline` + `Examples` | Array data + `for` yang membuat `test` per baris |
| `@tag` | `{ tag: '@smoke' }`, dijalankan dengan `--grep @smoke` |
| `local.runsettings` + `TestContext.Parameters` | `config/.env` + `config/env.config.ts` |
| `Browsers.cs` | `playwright.config.ts` (`use`, `projects`) |
| `Browsers.cs` remote Selenoid (`IsSelenoid`) | `utils/selenoidClient.ts` + `fixtures/browser-fixture.ts` |
| `Hooks.cs` Before/AfterScenario | Fixture: sebelum `use()` = setup, sesudah = teardown |
| `BasePages` / `BasePagesHelper` | Fixture `loginPage`, `homePage`, ... |
| `WebDriverExtensions` wrappers | `utils/elementHelper.ts` (aksi Playwright sudah auto-wait) |
| `Thread.Sleep` | `expect(...)` dengan auto-retry |
| Screenshot di AfterScenario | `screenshot/video/trace: 'only-on-failure' / 'retain-on-failure'` |
| `ScenarioContext` | State di page/helper (instance baru per test) |
| `TestDataSource.cs` (prefix per fitur) | `data/testDataSource.ts` (objek per fitur: `LoginData`, `CheckoutData`, ...) |
| `TestContext.Parameters.Get("X", default)` | `getParam('X', default)` di `config/env.config.ts` |
| `Examples` Scenario Outline | Array di testDataSource (mis. `InvalidLoginCases`) + `for` di test |
| `dotnet test --filter Name=...` | `npx playwright test -g "..."` |

Kalau test gagal: buka `npm run report`, lalu klik trace untuk melihat DOM, network, dan screenshot di setiap langkah.
