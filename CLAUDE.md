# CLAUDE.md

E2E-тесты Medusa Store (витрина `/dk` + Medusa Admin `/app`) на Playwright + TypeScript (strict), паттерн Page Object Model.
Подробности: [docs/framework/](docs/framework/README.md) — архитектура, конвенции, известные проблемы.

## Команды

```bash
npm test                                   # все тесты (setup → chromium + admin)
npx playwright test tests/auth/login.spec.ts
npx playwright test --project=setup        # пересоздать сессии и покупателя
npm run lint                               # ESLint, проверяет архитектурные правила
npm run typecheck                          # tsc --noEmit
```
Перед тем как считать изменение готовым, запусти `npm run lint` и `npm run typecheck`. E2E требуют `.env` с `SESSION_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Структура

- `config/env.ts` — env-геттеры и пути storageState. `data/` — фабрики данных. `helpers/` — сессия, логин, регистрация.
- `pages/<область>/*.page.ts` — страницы; `*.component.ts` — общие блоки (`AccountNav`, `AdminSidebar`).
- `fixtures/index.ts` — расширенный `test`; тесты импортируют `test`/`expect` **только отсюда**.
- `tests/auth/*.setup.ts` — проект `setup`. `tests/admin/**` идут в проект `admin` (сессия админа), всё остальное — в `chromium` (сессия покупателя).

## Жёсткие правила (линтер падает при нарушении)

- В `tests/**` запрещены `locator()`, `getBy*()`, `$`, `$$`, `page.goto()`: селекторы и навигация живут только в PO.
- Запрещены `waitForTimeout`, `test.only`, `test.skip`.

## Конвенции

- Локаторы — `readonly`-поля, создаются в конструкторе. Витрина: `getByTestId`. Админка (там нет `data-testid`): `getByRole(…, { name })`. Внутри компонента ищем от `this.root`. Без XPath, CSS и индексов.
- Методы-переходы возвращают следующий PO (`login(): Promise<AccountOverviewPage>`). В PO нет `expect`, все проверки — в тестах.
- Ожидания: web-first `expect` в тестах; `waitForLoaded()` / `waitForURL` — только в setup и хелперах. Без `networkidle`.
- Заголовок теста: `'AUTH-01: expected behaviour'`; префиксы `AUTH-`, `ACC-`, `ADM-`. Новый тест также добавляется в таблицу в `README.md`.
- Данные стенда сохраняются между прогонами: email и сущности создаются только через фабрики в `data/` с уникальным id. Покупатель из setup доступен фикстурой `customer`.
- Проверка логина без сессии: `test.use({ storageState: SESSION_STORAGE_STATE })`.
- Тесты идут последовательно (`workers: 1`, одна БД на стенд). Не включай параллелизм.
- Код и комментарии — на английском, коротко, объясняют «почему».

## Git

Изменяющие git-операции выполняются только по явной просьбе. Прямые коммиты в `main`, force push, rebase/amend/reset --hard, merge PR и удаление веток запрещены. Ветки называются `type/описание`, коммиты оформляются по Conventional Commits, PR создаётся в `main` без описания. Полные правила (часть из них технически закреплена в `.claude/settings.json`):

@docs/framework/04-git-rules.md

## Секреты

`.env` и `playwright/.auth/*` содержат ссылку стенда, креды и cookie сессий. Не выводи их содержимое, не коммить и не вставляй в код или логи.
