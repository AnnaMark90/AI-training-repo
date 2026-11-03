# Конвенции: как писать тесты в стиле фреймворка

Раздел **A** — то, что прямо видно в коде (с указанием файла). Раздел **B** — выводы, которые из кода напрямую не следуют; их нужно подтвердить с командой.

---

## A. Видно из примеров

### A1. Нейминг файлов и папок

| Что | Шаблон | Пример |
|---|---|---|
| Page Object | `pages/<область>/<имя>.page.ts`, kebab-case | `pages/admin/admin-customers.page.ts` |
| Компонент | `pages/<область>/<имя>.component.ts` | `pages/account/account-nav.component.ts` |
| Хелпер | `helpers/<имя>.helper.ts` | `helpers/auth.helper.ts` |
| Тест | `tests/<область>/<имя>.spec.ts` | `tests/account/profile-navigation.spec.ts` |
| Setup | `tests/auth/<имя>.setup.ts` (матчится по `/.*\.setup\.ts/`) | `tests/auth/admin.setup.ts`, `playwright.config.ts:32` |
| Данные | `data/<сущность>.ts` | `data/customer.ts` |

Админские файлы и классы начинаются с `admin-` / `Admin` (`pages/admin/*`). Страницы витрины префикса не имеют, но класс может уточнять область: файл `overview.page.ts` содержит класс `AccountOverviewPage` (`pages/account/overview.page.ts:5`).

### A2. Нейминг в коде

- **Классы**: PascalCase. У страниц суффикс `Page` (`LoginPage`, `AdminOrdersPage`), у компонентов суффикса нет (`AccountNav`, `AdminSidebar`): `pages/account/account-nav.component.ts:4`, `pages/admin/admin-sidebar.component.ts:4`.
- **Поля-локаторы**: camelCase, имя заканчивается типом элемента — `emailInput`, `submitButton`, `profileLink`, `errorMessage`, `heading`, `searchInput` (`pages/login/login.page.ts:7-11`, `pages/admin/admin-customers.page.ts:7-8`). Корневой контейнер компонента называется `root` (`pages/account/account-nav.component.ts:5`), контейнер страницы — `wrapper` (`pages/account/overview.page.ts:8`).
- **Методы**: глаголы — `goto()`, `waitForLoaded()`, `login()`, `register()`, `search()`. Переход на другую страницу — `open<Страница>()` (`openProfile`, `openCustomers`, `openRegister`). Параметризованный локатор оформляется методом `<сущность>By<Признак>(value): Locator` (`rowByEmail`, `pages/admin/admin-customers.page.ts:29-31`).
- **Тесты**: `describe` по фиче (`'Login'`, `'Admin'`, `'Account navigation'`), заголовок теста — `'<ID>: <ожидаемое поведение>'`. Префиксы: `AUTH-`, `ACC-`, `ADM-`, номера двузначные (`tests/auth/login.spec.ts:8,16`, `tests/admin/admin.spec.ts:9,18`; правило записано в `README.md:148`). Заголовки setup-тестов описывают действие без ID (`tests/auth/global.setup.ts:7`).

### A3. Структура Page Object

```ts
import { Page, Locator } from '@playwright/test';

export class XxxPage {
  readonly page: Page;
  readonly nav: SomeComponent;      // компоненты — через композицию
  readonly wrapper: Locator;        // все статические локаторы — readonly-поля

  constructor(page: Page) {
    this.page = page;
    this.nav = new SomeComponent(page);
    this.wrapper = page.getByTestId('xxx-page-wrapper');
  }

  async goto() { await this.page.goto('/dk/...'); }   // относительный путь от baseURL
  async waitForLoaded() { await this.wrapper.waitFor(); }

  async openNext(): Promise<NextPage> {               // переход возвращает следующий PO
    await this.nav.nextLink.click();
    return new NextPage(this.page);
  }
}
```
Основание: `pages/account/overview.page.ts:1-32`, `pages/admin/admin-orders.page.ts:1-28`.

- Компоненты **не хранят** `page` и не имеют `goto()`: только `root` и дочерние локаторы (`pages/account/account-nav.component.ts:4-20`).
- В PO нет `expect`: проверки делаются только в тестах (`README.md:143`; ни один файл в `pages/` не импортирует `expect`).
- Пути в `goto()` относительные: `'/dk/account'`, `'/app/orders'`. Хост берётся из `baseURL` (`playwright.config.ts:21-22`).

### A4. Стратегия локаторов

| Приложение | Основной способ | Основание |
|---|---|---|
| Витрина (`/dk`) | `getByTestId('kebab-case-id')` | `pages/login/login.page.ts:15-19`, `pages/login/register.page.ts:16-21`, `pages/account/*` |
| Medusa Admin (`/app`) | `getByRole(role, { name })`; у заголовков указывается `level: 1` | `pages/admin/admin-orders.page.ts:13`, `pages/admin/admin-sidebar.component.ts:12-16` |
| Admin, если роли нет | `getByPlaceholder` | `pages/admin/admin-login.page.ts:13` |

- Внутри компонента элементы ищутся от `root`: `this.root.getByTestId(...)`, `this.root.getByRole(...)` (`pages/account/account-nav.component.ts:14-18`, `pages/admin/admin-sidebar.component.ts:13-16`).
- Строку таблицы ищут через `getByRole('row').filter({ hasText })` (`pages/admin/admin-customers.page.ts:30`).
- XPath, CSS-селекторы и индексы (`nth`, `first`) в коде не встречаются. `README.md:142` прямо запрещает XPath и индексы.
- В админке `data-testid` нет — это зафиксировано в комментарии `pages/admin/admin-sidebar.component.ts:3` и в `README.md:130`.

### A5. Ожидания

- **В тестах** только web-first assertions: `await expect(locator).toBeVisible() / toContainText() / toHaveText() / toBeHidden()`, `await expect(page).toHaveURL(regex)` (`tests/auth/login.spec.ts:12-13,20-21`, `tests/account/profile-navigation.spec.ts:8-9`).
- **В PO** для синхронизации есть `waitForLoaded()` = `locator.waitFor()` (видимость ключевого элемента). Его вызывают setup-файлы, где `expect` не используется: `tests/auth/global.setup.ts:15`, `tests/auth/admin.setup.ts:13`, а для них отключено правило `expect-expect` (`eslint.config.mjs:30-34`).
- **В хелперах** используется `page.waitForURL(regex)` (`helpers/auth.helper.ts:23`).
- `waitForTimeout` запрещён линтером (`eslint.config.mjs:14`), `networkidle` не применяется, потому что витрина держит фоновые запросы (`README.md:191`).
- Таймауты дефолтные. Исключение — увеличенный таймаут для «холодной» админки: `setup.setTimeout(90_000)` (`tests/auth/admin.setup.ts:5-6`).

### A6. Тестовые данные и сессии

- **Уникальность**: данные на стенде сохраняются между прогонами, поэтому сущности создаются фабриками с уникальным id: `createCustomer()` даёт `qa+<id>@example.test` (`data/customer.ts:8-16`). Хардкодить email запрещено (`README.md:147`).
- **Один покупатель на прогон**: его регистрирует setup, данные сохраняются в `playwright/.auth/customer-data.json` (`tests/auth/global.setup.ts:13-17`, `helpers/customer.helper.ts:6-9`), а тесты получают их фикстурой `customer` (`fixtures/index.ts:37-39`).
- **Негативные данные** пишутся литералом прямо в тесте: `'wrong-password'` (`tests/auth/login.spec.ts:18`).
- **Секреты и креды** читаются только через `env.*` (`config/env.ts`), в тестах — `env.adminEmail` (`tests/admin/admin.spec.ts:11`).
- **Сессии**: по умолчанию тест стартует залогиненным (покупатель в `chromium`, админ в `admin`). Чтобы проверить сам логин, достаточно сбросить сессию через `test.use({ storageState: SESSION_STORAGE_STATE })` внутри `describe` (`tests/auth/login.spec.ts:5-6`). Cookie стенда при этом сохраняется.

### A7. Структура теста

```ts
import { test, expect } from '../../fixtures';          // всегда из fixtures, не из @playwright/test

test.describe('Feature', () => {
  test('XXX-01: expected behaviour', async ({ somePage, customer }) => {
    await somePage.goto();                               // arrange / act — через PO
    const next = await somePage.openSomething();

    await expect(next.wrapper).toBeVisible();            // assert — пустая строка перед блоком expect
  });
});
```
Основание: `tests/account/profile-navigation.spec.ts:1-11`, `tests/auth/login.spec.ts:1-23`. Исключение: setup-файлы импортируют `test as setup` напрямую из `@playwright/test` и создают `AuthHelper` через `new` (`tests/auth/global.setup.ts:1,8`).

### A8. Стиль кода

Одинарные кавычки, точка с запятой, отступ 2 пробела, trailing commas в многострочных вызовах (`tests/admin/admin.spec.ts:18-21`, `helpers/auth.helper.ts:14-16`). Комментарии на английском, короткие, объясняют «почему» (`playwright.config.ts:10`, `tests/auth/login.spec.ts:5`). Используются `async/await` и явные возвращаемые типы у методов-переходов (`Promise<ProfilePage>`).
Prettier в репозитории не подключён, поэтому форматирование соблюдается вручную.

---

## B. Предположения (в коде прямо не зафиксировано)

1. **Какие PO добавлять в фикстуры.** Сейчас в фикстурах только «точки входа» с `goto()`, которые тесты открывают напрямую (`loginPage`, `accountPage`, `adminLoginPage`, `adminOrdersPage`). `ProfilePage` и `AdminCustomersPage` доступны только через переходы. *Похоже, правило такое: «в фикстуру попадает страница, с которой тест начинается»*, но нигде это не записано.
2. **Нумерация ID.** Видимо, номера идут подряд внутри префикса, а новая область получает новый префикс. Реестр ID ведётся только в таблице `README.md:154-160`, её нужно обновлять вручную.
3. **`waitForLoaded()` в тестах.** В spec-файлах он не вызывается: там вместо него `expect(...).toBeVisible()`. Можно предположить, что `waitForLoaded()` предназначен только для setup и хелперов.
4. **Что возвращает действие, которое не меняет страницу** (`search()`), — сейчас `void`. Возврат `this` (fluent) нигде не используется.
5. **Где хранить тексты сообщений** (`'Error: Invalid email or password'`). Сейчас они захардкожены в тесте, отдельного слоя с константами нет.
6. **Как создавать данные помимо покупателя** (заказы, товары). Примеров нет: API-слоя нет, и непонятно, создавать их через UI-хелперы или через Admin API.
7. **`test.step`, теги, аннотации** не используются. Неизвестно, это сознательное решение или «пока не понадобилось».
8. **Независимость тестов** (`README.md:146`). Сейчас все тесты читают одного общего покупателя. Если тест меняет его профиль, то, вероятно, ему стоит создавать своего покупателя, но примера такого теста нет.

---

## Чек-лист нового теста

1. Нужные локаторы есть в PO? Если нет, добавить их в `pages/…` (`getByTestId` на витрине, `getByRole` в админке; внутри компонента — от `root`).
2. Новая стартовая страница? Тогда добавить PO в `fixtures/index.ts`.
3. Импортировать `test, expect` из `fixtures`, взять ID `ОБЛАСТЬ-NN`, сформулировать заголовок как ожидаемое поведение.
4. Данные брать из фикстуры `customer` или из фабрики в `data/`, никаких захардкоженных email.
5. Если нужен незалогиненный пользователь — `test.use({ storageState: SESSION_STORAGE_STATE })`.
6. Никаких `page.goto`, `locator`, `waitForTimeout` в spec-файлах. Перед коммитом запустить `npm run lint && npm run typecheck`.
7. Добавить строку в таблицу Test Cases в `README.md`.
