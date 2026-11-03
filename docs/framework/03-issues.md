# Потенциальные проблемы

Срез: ветка `main` @ `6b9b877`, 2026-11-03. Проверки: `npm run lint` и `npm run typecheck` проходят без ошибок, последний прогон — 7/7 passed (`test-results/results.json`).
Приоритет: **H** — может сломать прогон или дать ложный результат, **M** — усложняет поддержку или диагностику, **L** — косметика.

## 1. Устаревшие зависимости

Данные из `npm outdated`, `npm audit`, `git ls-remote` по репозиториям `actions/*` и `npm view @playwright/test engines`.

| # | Файл:строка | Сейчас | Актуально | Приор. | Комментарий |
|---|---|---|---|---|---|
| 1.1 | `package.json:19` | `@playwright/test` 1.63.0 | 1.64.1 | M | Минорное обновление, нужен `npx playwright install` |
| 1.2 | `package.json:22`, `:25` | `eslint` 10.12.0, `typescript-eslint` 8.71.1 | 10.14.0, 8.72.1 | L | Минорные обновления |
| 1.3 | `package.json:20`, `:21`, `:23` | `@types/node` 26.6.2, `dotenv` 18.0.6, `eslint-plugin-playwright` 2.12.1 | 26.6.6, 18.0.9, 2.12.2 | L | Патч-обновления |
| 1.4 | `package.json:24` | `typescript` 6.0.3 | 7.0.2 (major) | M | Перед переходом проверить, поддерживает ли `typescript-eslint` 8.x TS 7. Не обновлять вслепую |
| 1.5 | `package-lock.json` (транзитивно) | `minimatch` < 11.0.1 | — | L | `npm audit`: 12 moderate (GHSA-g3hv-75wg-m249) через цепочку eslint. Только dev-зависимости. Предлагаемый `npm audit fix --force` откатит eslint до 4.0.0 — **не запускать** |
| 1.6 | `.github/workflows/playwright.yml:19`, `:20`, `:38` | `actions/checkout@v4`, `setup-node@v4`, `upload-artifact@v4` | v7 | M | Отстают на 3 мажорные версии |
| 1.7 | `.github/workflows/playwright.yml:22` | `node-version: lts/*` | — | M | Версия плавает, сборка невоспроизводима. Лучше закрепить (например, `24`) |
| 1.8 | `README.md:81` + `package.json` (нет `engines`) | «Node.js v18+» | Playwright требует `>=20` | M | README вводит в заблуждение. Стоит добавить `"engines": { "node": ">=20" }` |

## 2. Дублирование кода

| # | Файл:строка | Что дублируется | Приор. | Предложение |
|---|---|---|---|---|
| 2.1 | `pages/account/overview.page.ts:21`, `pages/account/profile.page.ts:16`, `pages/login/login.page.ts:28`, `helpers/auth.helper.ts:23`, `tests/account/profile-navigation.spec.ts:8` | Локаль `/dk` захардкожена в 5 местах | M | Вынести в константу (`config/env.ts`: `STORE_LOCALE = '/dk'`) |
| 2.2 | `pages/login/login.page.ts:27-29` и `pages/account/overview.page.ts:20-22` | Два `goto()` на один URL `/dk/account` | L | Это осознанно (по URL открывается логин или кабинет в зависимости от сессии), но стоит пояснить комментарием или использовать общую константу пути |
| 2.3 | `pages/account/overview.page.ts:6,13,20-26`, `pages/account/profile.page.ts:5,10,15-21`, `pages/admin/admin-orders.page.ts:6,11,16-22`, `pages/admin/admin-customers.page.ts:5,11,17-23` | Шаблон `page` + `goto()` + `waitForLoaded()` копируется в каждый PO | L | При росте числа страниц ввести `BasePage` с полями `path` и `readyLocator` |
| 2.4 | `tests/auth/global.setup.ts:8-10`, `tests/auth/admin.setup.ts:9-11` | Оба setup открывают сессию заново (`new AuthHelper` + `openSession()`) | L | Admin-setup может стартовать с `session.json`, но тогда нужен `dependencies` между setup-проектами (см. 5.1) |
| 2.5 | `fixtures/index.ts:3,11,21-23` | Фикстура `authHelper` нигде не используется: setup-файлы создают `new AuthHelper(page)` сами (`tests/auth/global.setup.ts:8`, `tests/auth/admin.setup.ts:9`) | L | Удалить фикстуру или перевести setup-файлы на `fixtures` |

## 3. Отсутствие или недостаточность обработки исключений

| # | Файл:строка | Проблема | Приор. | Последствие |
|---|---|---|---|---|
| 3.1 | `helpers/customer.helper.ts:11-13` | `readFileSync` и `JSON.parse` без try/catch и без проверки полей | M | Если setup не запускался (`--no-deps`, удалён `playwright/.auth`), тест падает с голым `ENOENT` или `SyntaxError`. Сейчас это компенсирует только строка в README (`README.md:187`). Нужна понятная ошибка «run `--project=setup` first» |
| 3.2 | `helpers/auth.helper.ts:12-22` | Проверяются только `403` и `>=500`. `response === null`, `401`, `404` и прочие `4xx` не обрабатываются. Страница-заглушка «A session link is required» с кодом 200 (`README.md:185`) тоже не распознаётся | M | Ошибка проявляется как таймаут `waitForURL` (`:23`) без объяснения причины |
| 3.3 | `helpers/auth.helper.ts:28-30` | `page.goto(env.adminUrl)` без проверки статуса, в отличие от `openSession()` | M | Отозванный `ADMIN_URL` даёт таймаут на `fill()` в `AdminLoginPage.login`, а не явную ошибку |
| 3.4 | `pages/login/login.page.ts:31-37`, `pages/login/register.page.ts:24-32`, `pages/admin/admin-login.page.ts:21-27` | Методы-переходы возвращают следующий PO, не убедившись, что переход произошёл | M | Ошибка регистрации (email занят, валидация) проявляется только таймаутом `waitForLoaded()` в `tests/auth/global.setup.ts:15`, без текста ошибки формы. В AUTH-02 `login()` возвращает `AccountOverviewPage`, хотя логин неуспешен (`tests/auth/login.spec.ts:18`) — контракт метода вводит в заблуждение |
| 3.5 | `playwright.config.ts:30-33`, `:38` | `chromium` зависит от проекта `setup`, в который входит и `admin.setup.ts` | **H** | Нельзя прогнать только тесты покупателя без `ADMIN_EMAIL`/`ADMIN_PASSWORD` (`config/env.ts:31-36` бросает ошибку) и без живой админки. Падение админки роняет весь прогон. Лучше разделить на `setup-customer` и `setup-admin` |
| 3.6 | `config/env.ts:15-22` + `playwright.config.ts:22` | `baseUrl` вычисляется при загрузке конфига | L | Любая команда, которая грузит конфиг (`--list`, `test:ui`), требует `SESSION_URL`. Это осознанный fail-fast, но для `--list` неудобно |

## 4. Хрупкие локаторы

| # | Файл:строка | Локатор | Приор. | Почему хрупкий |
|---|---|---|---|---|
| 4.1 | `pages/admin/admin-sidebar.component.ts:16` | `getByRole('button', { name: /@/ })` | **H** | Совпадёт с любой кнопкой, в имени которой есть `@`. Привязка к формату email, а не к элементу |
| 4.2 | `pages/admin/admin-sidebar.component.ts:12` | `getByRole('complementary')` | M | Любой `<aside>`. Если появится второй (drawer, панель фильтров) — strict mode violation во всех админских PO |
| 4.3 | `pages/admin/admin-login.page.ts:13` | `getByPlaceholder('Password')` | M | Плейсхолдер — это текст для пользователя, он зависит от локали и копирайта. Непоследовательно с `emailInput` (`:12`), который ищется по роли. Лучше `getByLabel('Password')` или `getByRole('textbox', …)`, если доступно |
| 4.4 | `pages/admin/admin-login.page.ts:14`, `pages/admin/admin-orders.page.ts:13`, `pages/admin/admin-customers.page.ts:13-14`, `pages/admin/admin-sidebar.component.ts:13-15` | Имена по видимому тексту: `'Continue with Email'`, `'Orders'`, `'Customers'`, `'Search'` | M | Админка не имеет `data-testid` (вынужденная мера), но смена языка интерфейса или текста кнопки ломает все админ-тесты. Тексты стоит вынести в одно место |
| 4.5 | `pages/login/login.page.ts:19` и `pages/login/register.page.ts:21` | Один и тот же `getByTestId('register-button')` для ссылки «перейти к регистрации» и для submit формы | M | Если обе формы окажутся в DOM одновременно — strict mode violation или клик не по той кнопке. Из репозитория не видно, рендерит ли витрина их одновременно |
| 4.6 | `pages/login/login.page.ts:15-16`, `pages/login/register.page.ts:18,20` | `email-input` / `password-input` ищутся на уровне `page`, без scoping формой | M | Тот же риск, что в 4.5. Противоречит рекомендации README скоупить через родителя (`README.md:142`) |
| 4.7 | `pages/admin/admin-customers.page.ts:30` | `getByRole('row').filter({ hasText: email })` | L | Поиск по подстроке. При уникальных email риск низкий, но точнее матчить ячейку (`getByRole('cell', { name: email, exact: true })`) |
| 4.8 | `tests/auth/login.spec.ts:20` | `toHaveText('Error: Invalid email or password')` | L | Точное совпадение с копирайтом. Правка текста ломает тест, хотя функциональность в порядке |

## 5. Прочие риски (дизайн тестов и стабильность)

| # | Файл:строка | Проблема | Приор. |
|---|---|---|---|
| 5.1 | `tests/auth/global.setup.ts:13-17`, `data/customer.ts:8` | Каждый прогон регистрирует нового покупателя, очистки нет. База стенда растёт, и со временем список клиентов в админке разрастается | M |
| 5.2 | `tests/admin/admin.spec.ts:22-26` + `pages/admin/admin-customers.page.ts:25-27` | `search()` только заполняет поле и не ждёт применения фильтра. Если покупатель уже виден на первой странице списка, ADM-02 пройдёт **даже при сломанном поиске** | M |
| 5.3 | `tests/auth/login.spec.ts:21` | `toBeHidden()` на навигации кабинета — слабая негативная проверка: она проходит и тогда, когда страница ещё не успела отрисоваться. Лучше дополнительно проверить URL или наличие формы логина | L |
| 5.4 | `fixtures/index.ts:37-39` | Фикстура `customer` с областью видимости test перечитывает файл в каждом тесте. Можно сделать её worker-scoped | L |
| 5.5 | `tests/auth/admin.setup.ts:6` | Магическое число `90_000`, а в `playwright.config.ts` нет ни `timeout`, ни `expect.timeout`, ни `navigationTimeout` | L |
| 5.6 | `.github/workflows/playwright.yml:2-4` | Триггер `push` на любую ветку и нет `pull_request`. При общей группе `concurrency` (`:6-8`) пуши в разные ветки выстраиваются в очередь | L |
| 5.7 | `README.md:156-160` | Колонка Status со статичными ✅ расходится с оговоркой `README.md:15` («not a green run») | L |

## Что исправить в первую очередь

1. **3.5** — развязать customer- и admin-setup.
2. **4.1, 4.2** — надёжные локаторы для меню пользователя и сайдбара админки.
3. **5.2** — дождаться результата поиска в ADM-02 (например, проверить, что все строки содержат искомое значение, или дождаться ответа API поиска).
4. **3.1–3.4** — понятные ошибки в хелперах и проверка переходов в PO.
5. **1.1, 1.6, 1.7, 1.8** — обновить Playwright и actions, закрепить Node.
