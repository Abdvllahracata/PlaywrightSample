# Playwright + TypeScript Framework

Framework latihan (poin 1–5 dari roadmap). AUT: saucedemo.com (UI) dan jsonplaceholder.typicode.com (API).

## Setup

```powershell
npm install
copy config\.env.example config\.env   # lalu isi nilainya (= local.runsettings)
```

Browser: test e2e jalan di **Google Chrome dan Microsoft Edge yang terinstall di PC** (`channel` di config)
serta **Firefox bawaan Playwright**. Firefox perlu di-download sekali:

```powershell
npx playwright install firefox
# di mesin tanpa Chrome/Edge (mis. agent CI) sekalian:
npx playwright install chrome msedge firefox
```

Project `safari` (WebKit, engine di balik Safari) **dinonaktifkan** karena test-nya kadang timeout saat jalan paralel
dengan browser lain. Untuk mengaktifkan lagi: hapus komentar project `safari` di `playwright.config.ts`, lalu
`npx playwright install webkit`.

## Menjalankan test

| Perintah | Fungsi |
|---|---|
| `npm test` | Semua project: `api` sekali + e2e di `chrome`, `edge`, dan `firefox` |
| `npm run test:chrome` / `test:edge` / `test:firefox` | e2e di satu browser saja |
| `npm run test:smoke` | Hanya tag `@smoke` |
| `npm run test:regression` | Hanya tag `@regression` |
| `npm run test:e2e` / `npm run test:api` | Hanya UI (semua browser yang aktif) / hanya API |
| `npx playwright test --project=chrome -g "Login berhasil"` | Satu test di satu browser |
| `npm run test:headed` | Browser terlihat |
| `npm run test:ui` | UI mode: pilih test, lihat tiap langkah |
| `npm run test:debug` | Debugger langkah demi langkah |
| `npm run report` | Buka HTML report terakhir |
| `npm run typecheck` | Cek error TypeScript |
| `npx playwright test -g "Login berhasil"` | Satu test berdasarkan judul |
| `npm run test:staging` | Semua test dengan `config/.env.staging` alih-alih `config/.env` (lihat bagian Environment) |
| `HEADLESS=false` di `config/.env` | Tampilkan browser tanpa ubah kode (atau `npm run test:headed`) |
| `npm run test:selenoid` / `npm run test:local` | Paksa Selenoid (api + chrome) / paksa browser lokal untuk satu run, apa pun isi `IS_SELENOID` di `.env` |

## Login sekali (storageState)

Project `setup` (`tests/setup/auth.setup.ts`) login satu kali lalu menyimpan sesi (cookie + localStorage) ke
`.auth/<env>.json`. Project `chrome`, `edge`, dan `firefox` bergantung pada `setup` (`dependencies`) dan memuat sesi itu lewat
`storageState`, jadi test e2e langsung mulai dalam keadaan login (`homePage.goto()`), tanpa mengisi form login lagi.
`setup` ikut jalan otomatis walaupun yang dijalankan hanya satu test (termasuk dari extension VS Code).

- Test yang harus mulai dari kondisi belum login (mis. `login.spec.ts`) memakai
  `test.use({ storageState: { cookies: [], origins: [] } })`.
- Folder `.auth/` berisi sesi aktif dan tidak di-commit.

## Environment

`ENV=<nama>` membaca `config/.env.<nama>` alih-alih `config/.env`. Untuk menambah environment, salin `config/.env`
menjadi `config/.env.<nama>` lalu ganti nilainya (URL, akun uji). File ini tidak di-commit.
Nama environment tampil di metadata HTML report, dan sesi login disimpan terpisah per environment (`.auth/<nama>.json`).
Kalau file environment tidak ada, test langsung berhenti dengan pesan `Variabel "BASE_URL" kosong. Cek file config/.env.<nama>`.

## Menjalankan di Selenoid (remote)

Padanan `IsSelenoid=true` di `local.runsettings`. Isi di `config/.env` (lihat `.env.example`):

```
IS_SELENOID=false                                   # false = browser lokal, true = Selenoid
SELENOID_URL=http://<host>:4444                     # = SeleniumRemote
SELENOID_USERNAME=<user>                            # = SeleniumUsername
SELENOID_PASSWORD=<password>                        # = SeleniumPassword
SELENOID_CHROME_VERSION=125.0                       # = SeleniumBrowserVersion
SELENOID_SESSION_TIMEOUT=2m
IS_ENABLE_VIDEO=false                               # video di Selenoid (video/trace Playwright tetap jalan)
SELENOID_WORKERS=1                                  # jumlah sesi paralel (opsional, default 1)
```

Di mode Selenoid test jalan dengan `SELENOID_WORKERS` worker (default 1) dan batas navigasi 30 detik.
Dengan 2 sesi paralel atau lebih, server menutup browser di tengah test (`Target page, context or browser has been closed`)
dan kadang menolak sesi baru (`ECONNRESET` / `ECONNREFUSED`). Naikkan hanya kalau kapasitas server sudah ditambah.

Cara kerja (`fixtures/browser-fixture.ts` + `utils/selenoidClient.ts`):
1. Per worker dibuat satu sesi WebDriver di Selenoid (nama `Playwright <project> - worker <n>` di UI Selenoid, VNC aktif).
2. Playwright tersambung ke browser itu lewat CDP (`/devtools/<sessionId>`). Tiap test tetap dapat context baru.
3. Selama sesi hidup dikirim ping WebDriver tiap ½ `sessionTimeout`, karena trafik CDP tidak dihitung Selenoid.
4. Setelah worker selesai (lulus/gagal) sesi di-DELETE. Kalau proses dimatikan paksa, ping berhenti dan Selenoid menutup sesi setelah `sessionTimeout`.

`IS_SELENOID` berlaku untuk semua cara menjalankan test: `npm test`, `npm run test:ui`, dan tombol ▶ di extension VS Code.
Saat `true`, project `edge` dan `firefox` otomatis dilewati.

Batasan: hanya Chrome (Edge di server tidak tersedia, Firefox tidak didukung CDP). Satu sesi Selenoid berisi beberapa test (per worker),
jadi untuk melihat satu test pakai video/trace Playwright di HTML report, bukan video Selenoid.
Page object, test, dan helper tidak berubah sama sekali antara lokal dan Selenoid.

## Struktur

```
tests/
  e2e/           Test UI (*.spec.ts)
  api/           Test API (*.spec.ts)
  setup/         auth.setup.ts: login sekali dan simpan sesi untuk test e2e
pages/           Page Object: locator + aksi + assertion (expect...)
fixtures/        browser-fixture.ts: browser lokal / Selenoid; base-fixture.ts: inject page object, API client, apiCustomer
utils/           elementHelper (open/click/fill/expect...), apiHelper, selenoidClient, helpers
data/            testData.ts: data tetap per fitur (LoginData, CheckoutData, ...); dataFactory.ts: data acak
config/          .env (nilai, = local.runsettings) + .env.example (contoh) + env.config.ts (pembaca)
.auth/           sesi login dari project setup (tidak di-commit)
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
- **Tidak ada nilai hardcode** di test maupun page. Data diambil dari `data/` atau fixture:
  - Data tetap (nilai yang dicocokkan atau menunjuk data tertentu: nama produk, pesan yang diharapkan, id):
    `data/testData.ts`. Nilai yang bisa di-override lewat `.env` memakai `getParam('KEY', 'default')`, mis. akun uji.
  - Data acak (pengisi yang bebas, asal valid): factory di `data/dataFactory.ts` (`buildCustomer()`, `buildPost()`,
    `buildOrder()`, bisa diberi `overrides`).
  - Data dari API: fixture `apiCustomer` mengambil user dari API lalu dipetakan lewat `buildCustomer()`.
- Parameter default membuat test lebih ringkas: `loginPage.openAndLogin()` = login user valid, `checkoutPage.submitCustomer()` = data acak.
- Locator: `getByRole` / `getByLabel` / `getByTestId` (atributnya diatur lewat `testIdAttribute` di `playwright.config.ts`). Hindari XPath.

> **Catatan `data-test` vs `data-testid`:** saat ini `testIdAttribute` masih `'data-test'` karena aplikasi latihan
> (saucedemo) memakai atribut `data-test`. Implementasi di aplikasi kita semuanya memakai `data-testid`, jadi saat
> framework ini dipakai untuk aplikasi tersebut, ubah `testIdAttribute` menjadi `'data-testid'` di `playwright.config.ts`.
> Kalau atributnya tidak cocok dengan aplikasi yang diuji, semua `getByTestId(...)` tidak menemukan elemen
> (mis. `Tombol Login tidak tampil` di project `setup`).
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
| `Background` "saya sudah login" | Project `setup` + `storageState` (login sekali per run) |
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
| `TestDataSource.cs` (prefix per fitur) | `data/testData.ts` (objek per fitur: `LoginData`, `CheckoutData`, ...) |
| `TestContext.Parameters.Get("X", default)` | `getParam('X', default)` di `config/env.config.ts` |
| `Examples` Scenario Outline | Array di testData (mis. `InvalidLoginCases`) + `for` di test |
| `dotnet test --filter Name=...` | `npx playwright test -g "..."` |

Kalau test gagal: buka `npm run report`, lalu klik trace untuk melihat DOM, network, dan screenshot di setiap langkah.
