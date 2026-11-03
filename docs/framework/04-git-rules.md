# Правила работы с git

Правила обязательны для Claude и для людей. Технически они дублируются в `.claude/settings.json`:
- `deny` — запрещённые команды, Claude не сможет их выполнить;
- `ask` — `git add`, `git commit`, `git push` и `gh pr create` всегда требуют подтверждения.

## 1. Без запроса ничего не делать

- Любые изменяющие git-операции (`add`, `commit`, `push`, создание ветки, создание PR) выполняются **только по явной просьбе пользователя в чате**. Каждая просьба действует на одну операцию. Разрешение на коммит не означает разрешения на push.
- Без запроса можно выполнять только операции чтения: `git status`, `git diff`, `git log`, `git show`, `git branch`, `git fetch`, `git ls-remote`.
- Если пользователь попросил закоммитить, а текущая ветка — `main`, сначала нужно создать feature-ветку (см. §3) и сообщить её имя.

## 2. Полностью запрещено (даже по просьбе)

| Запрет | Примеры команд |
|---|---|
| Коммит и push прямо в `main` | `git commit` на ветке `main`, `git push origin main`, `git push origin HEAD:main` |
| Force push и переписывание истории | `git push --force` / `-f` / `--force-with-lease` / `+ref`, `git rebase`, `git reset --hard`, `git commit --amend`, `git filter-branch` |
| Merge PR и удаление веток | `gh pr merge`, auto-merge, `git branch -d/-D`, `git push --delete`, `git push origin :branch` |
| Коммит секретов и артефактов | `.env`, `playwright/.auth/`, `test-results/`, `playwright-report/`, `node_modules/`; `git add -f` / `--force` запрещён |

Если задача требует одной из этих операций, нужно остановиться, объяснить причину и предложить пользователю выполнить операцию самому.

## 3. Ветки

Формат: `<type>/<короткое-описание>` — kebab-case, на английском, без ID.

| type | Когда |
|---|---|
| `feature/` | новые тесты, Page Objects, возможности фреймворка |
| `fix/` | исправление падающего или флакающего теста, бага во фреймворке |
| `refactor/` | изменение структуры без изменения поведения |
| `chore/` | зависимости, конфиги, CI |
| `docs/` | только документация |

Примеры: `feature/logout-test`, `fix/admin-sidebar-locators`, `chore/update-playwright`.
Ветка создаётся от актуального `main` (перед этим выполнить `git fetch`).

## 4. Коммиты — Conventional Commits

```
<type>(<scope>): <subject>

[body: что и почему, если из subject неочевидно]

Co-Authored-By: Claude <noreply@anthropic.com>
```

- `type`: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `ci`, `build`.
- `scope` — область: `auth`, `account`, `admin`, `pages`, `fixtures`, `config`, `data`, `helpers`, `ci`, `deps`.
- `subject` — на английском, в повелительном наклонении, со строчной буквы, без точки в конце, ≤ 72 символов. ID тестов можно указывать в subject: `test(auth): add AUTH-03 logout test`.
- В конце сообщения добавляется трейлер `Co-Authored-By: Claude` (по умолчанию его добавляет Claude Code).
- Один коммит — одно логическое изменение.

Примеры:
```
test(auth): add AUTH-03 logout test
fix(admin): wait for search results in ADM-02
refactor(pages): extract store locale into config
chore(deps): bump @playwright/test to 1.64.1
```

## 5. Перед коммитом

1. `git status` и `git diff --staged`: в коммит попадают только файлы, относящиеся к задаче. Секретов и артефактов из §2 в нём нет.
2. `npm run lint` и `npm run typecheck` проходят.
3. Затронутые e2e-тесты прогнаны на стенде: `npx playwright test <изменённые spec-файлы>`. Если менялся общий код (`pages/`, `fixtures/`, `helpers/`, `config/`), прогнать все spec-файлы, которые его используют.
4. Если какую-то из проверок выполнить не удалось (например, нет `.env`), прямо сказать об этом пользователю до коммита.

## 6. Pull Request

- Создаётся только по запросу пользователя и только в `main`.
- Заголовок оформляется как subject коммита (Conventional Commits). **Описание не заполняется**: тело PR пустое, без шаблонов и без подписи «Generated with Claude Code» (в `.claude/settings.json` задано `attribution.pr: ""`).
- Merge, auto-merge, закрытие PR и удаление веток выполняет только человек.
