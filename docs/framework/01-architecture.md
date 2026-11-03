# Архитектура фреймворка

Анализ ветки `main` (коммит `6b9b877`). Каждое утверждение опирается на конкретный файл; то, чего в репозитории нет, помечено **«не видно»**.

## Что тестируется

- Medusa Store: витрина (storefront) с локалью `/dk` и Medusa Admin по пути `/app` — `README.md:11-12`, `config/env.ts:30`, `pages/admin/admin-login.page.ts:18`.
- Стенд выбирается cookie, которую ставит секретная ссылка `SESSION_URL` (`config/env.ts:10-13`, `helpers/auth.helper.ts:10-12`). `baseURL` = origin этой ссылки (`config/env.ts:15-22`, `playwright.config.ts:22`).
- У каждого инженера свой стенд с одной БД, поэтому тесты идут строго последовательно: `fullyParallel: false`, `workers: 1` (`playwright.config.ts:10-12`), `concurrency` в CI (`.github/workflows/playwright.yml:5-8`).

## Слои

| Слой | Где | Ответственность | Основание |
|---|---|---|---|
| Конфигурация | `playwright.config.ts`, `config/env.ts`, `.env` / `.env.example`, `tsconfig.json`, `eslint.config.mjs` | Projects, reporter-ы, env-переменные через геттеры, пути к storageState | `playwright.config.ts:1-47`, `config/env.ts:1-46` |
| Тестовые данные | `data/` | Типы и фабрики данных (`Customer`, `createCustomer()`) | `data/customer.ts:1-17` |
| Page Objects | `pages/<область>/*.page.ts` | Локаторы и действия одной страницы | `pages/login/login.page.ts`, `pages/admin/admin-orders.page.ts` |
| Компоненты | `pages/<область>/*.component.ts` | Общие для нескольких страниц блоки (навигация, сайдбар) | `pages/account/account-nav.component.ts`, `pages/admin/admin-sidebar.component.ts` |
| Хелперы | `helpers/` | Многошаговые сценарии (сессия, логин в админку, регистрация) и работа с файлами | `helpers/auth.helper.ts`, `helpers/customer.helper.ts` |
| Фикстуры | `fixtures/index.ts` | Расширенный `test`: внедрение PO и данных; реэкспорт `expect` | `fixtures/index.ts:20-42` |
| Setup | `tests/auth/*.setup.ts` | Готовят storageState и тестового покупателя | `tests/auth/global.setup.ts`, `tests/auth/admin.setup.ts` |
| Тесты | `tests/<область>/*.spec.ts` | Сценарии и `expect` | `tests/auth/login.spec.ts`, `tests/admin/admin.spec.ts`, `tests/account/profile-navigation.spec.ts` |
| CI | `.github/workflows/playwright.yml` | lint → typecheck → e2e (только если задан секрет `SESSION_URL`) | `.github/workflows/playwright.yml:25-37` |

## Используемые паттерны

1. **Page Object Model.** Один класс на страницу, локаторы — `readonly`-поля, которые создаются в конструкторе (`pages/login/login.page.ts:5-20`). Правило «селекторы только в `pages/`» проверяет ESLint: в `tests/**` запрещены `locator()`, `getBy*()`, `$`, `$$` и `page.goto()` (`eslint.config.mjs:17-27`).
2. **Page Components.** Повторяющиеся блоки вынесены в отдельные классы и подключаются композицией: `AccountNav` используется в `AccountOverviewPage` и `ProfilePage` (`pages/account/overview.page.ts:14`, `pages/account/profile.page.ts:11`), `AdminSidebar` — в двух админских страницах (`pages/admin/admin-orders.page.ts:12`, `pages/admin/admin-customers.page.ts:12`).
3. **Page chaining (переходы возвращают следующую страницу).** `LoginPage.login()` возвращает `AccountOverviewPage` (`pages/login/login.page.ts:31-37`), `openRegister()` возвращает `RegisterPage` (`:22-25`), `AdminOrdersPage.openCustomers()` возвращает `AdminCustomersPage` (`pages/admin/admin-orders.page.ts:24-27`).
4. **Custom fixtures как DI.** Тесты получают PO и данные через параметры, а не через `new` (`fixtures/index.ts:20-40`; использование — `tests/auth/login.spec.ts:8`).
5. **Setup-проекты + storageState.** Проект `setup` выполняет `*.setup.ts` (`playwright.config.ts:30-33`), а `chromium` и `admin` зависят от него (`:38`, `:44`) и стартуют с готовой сессией (`:37`, `:43`). Тесты, проверяющие сам логин, переопределяют сессию через `test.use({ storageState: SESSION_STORAGE_STATE })` (`tests/auth/login.spec.ts:6`, `tests/admin/admin.spec.ts:7`).
6. **Разделение по проектам через путь.** Всё из `tests/admin/` попадает в проект `admin`, остальное — в `chromium` (`playwright.config.ts:36`, `:42`).

### Поток выполнения

```
setup ─┬─ global.setup.ts: openSession → session.json → registerCustomer → customer.json + customer-data.json
       └─ admin.setup.ts:  openSession → loginAsAdmin → admin.json
chromium (customer.json) : tests/** кроме tests/admin/**
admin    (admin.json)    : tests/admin/**/*.spec.ts
```
Основание: `tests/auth/global.setup.ts:7-19`, `tests/auth/admin.setup.ts:8-16`, `config/env.ts:39-46`, `playwright.config.ts:29-46`.

## Ключевые библиотеки (`package.json:17-26`, установленные версии — из `npm ls`)

| Пакет | Версия | Зачем | Где видно |
|---|---|---|---|
| `@playwright/test` | 1.63.0 | Раннер, браузер, assertions | все `*.ts` в `pages/`, `tests/`, `fixtures/` |
| `typescript` | 6.0.3 | strict-типизация, только проверка (`noEmit`) | `tsconfig.json:6,9` |
| `dotenv` | 18.0.6 | Загрузка `.env` | `playwright.config.ts:1` |
| `eslint` + `@eslint/js` + `typescript-eslint` | 10.12.0 / 10.0.1 / 8.71.1 | Линтинг, flat config | `eslint.config.mjs:1-9` |
| `eslint-plugin-playwright` | 2.12.1 | Правила для тестов | `eslint.config.mjs:4,12-16` |
| `@types/node` | 26.6.2 | Типы для `node:fs`, `process.env` | `helpers/customer.helper.ts:1-2`, `tsconfig.json:11` |

Браузер: только Chromium (`devices['Desktop Chrome']`, `playwright.config.ts:37,43`; в CI ставится только `chromium`, `.github/workflows/playwright.yml:34`).
Репортеры: HTML и JSON в `test-results/results.json` (`playwright.config.ts:18`). Артефакты: trace на первом ретрае, скриншот при падении (`:25-26`).

## Чего в репозитории нет (не видно)

- **BasePage / общего базового класса** нет: каждый PO сам объявляет `page`, `goto()`, `waitForLoaded()`.
- **API-слоя** (`request`-фикстуры, API-клиентов) нет: даже данные готовятся через UI (`helpers/auth.helper.ts:36-41`).
- **Очистки тестовых данных** нет: покупатели создаются при каждом прогоне (`tests/auth/global.setup.ts:13`), а удалять их нечем.
- **Логирования, `test.step`, тегов (`@smoke`) и сторонних репортеров (Allure и т. п.)** нет.
- **Кросс-браузерных проектов, мобильных вьюпортов, визуальных и accessibility-проверок** нет.
- Конфигурации `timeout` / `expect.timeout` нет: используются дефолты Playwright, кроме `setup.setTimeout(90_000)` в `tests/auth/admin.setup.ts:6`.
- Код самих приложений (storefront/admin) отсутствует, поэтому `data-testid` и разметку по репозиторию проверить нельзя.
- В `origin` есть ветки, которые здесь не разбирались: `feature/CI-01-cicd-pipeline`, `feature/brittle-locators`, `feature/flaky-store-tests` (`git ls-remote origin`).
