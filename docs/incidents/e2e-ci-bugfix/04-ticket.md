# Bug: CI — джоба `e2e` падает на шаге `Test summary` с `ReferenceError: p is not defined`

## Атрибуты

| Поле | Значение |
|---|---|
| Тип | Bug |
| Компонент | CI / GitHub Actions: `.github/workflows/playwright.yml`, джоба `e2e`, шаг `Test summary` |
| Severity | Major: пайплайн всегда красный, хотя все тесты проходят |
| Priority | High: при заданных секретах стенда падает каждый запуск, CI нельзя использовать как gate |
| Статус | Open: причина установлена, исправление не применено |
| Воспроизводимость | 100%, детерминированно; воспроизведено локально |
| Обнаружено в | ветке `feature/CI-01-cicd-pipeline`, коммит `063c6a52f72122b5151569ae5f46980113b702a7` |
| Внесено коммитом | `063c6a5` «chore(ci): add broken workflow and Claude config files» |
| Дата обнаружения | 2026-11-03 09:54:21 UTC |
| Запуск | [Playwright Tests #41614491572](https://github.com/AnnaMark90/AI-training-repo/actions/runs/41614491572) |
| Джоба | [e2e #125844748611](https://github.com/AnnaMark90/AI-training-repo/actions/runs/41614491572/job/125844748611) |
| Annotation | `X Process completed with exit code 1.` — `e2e: .github#56` |

## Окружение

| | |
|---|---|
| Триггер | `workflow_dispatch`, input `run-mode = full` |
| Runner | GitHub-hosted, runner `2.338.2`, AWS us-east-1 |
| Образ | `ubuntu-24.04`, версия `20261018.96.1` (Ubuntu 24.04.5 LTS) |
| Node.js | `26.13.0`: `actions/setup-node@v4` с `node-version: lts/*` |
| Playwright | `@playwright/test 1.63.0`, Chrome for Testing `153.0.8010.12` (chromium v1243) |
| Shell шага | `/usr/bin/bash -e {0}` |
| Секреты | `SESSION_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` заданы (в логе `***`). `ADMIN_URL` пуст, он опциональный |
| `GITHUB_TOKEN` | `Contents: read`, `Metadata: read`, `Packages: read` |

## Предусловия

1. В репозитории заданы Actions-секреты `SESSION_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Без `SESSION_URL` шаг `Test summary` пропускается, и дефект не проявляется.
2. Ветка содержит коммит `063c6a5`.

## Шаги воспроизведения

1. Открыть **Actions → Playwright Tests → Run workflow**.
2. Выбрать ветку `feature/CI-01-cicd-pipeline`, `run-mode = full` (с `smoke` результат тот же). Нажать **Run workflow**.
3. Дождаться джобы `quality` (lint, typecheck), затем `e2e`.
4. Открыть джобу `e2e`, шаг `Test summary`.

## Ожидаемый результат

- Шаг `Test summary` завершается с кодом 0.
- В Summary запуска появляется блок «Playwright summary».
- Джоба `e2e` и весь запуск зелёные: все тесты прошли.

## Фактический результат

- Шаги 1–9 джобы `e2e` проходят:
  - `Run Playwright tests`: `Running 7 tests using 1 worker`, `7 passed (30.3s)`;
  - `upload-artifact`: отчёт `playwright-report` загружен, 2 файла, 205 194 байт.
- Шаг #10 `Test summary` падает через ~30 мс после старта: `ReferenceError: p is not defined`, `exit code 1`.
- Джоба `e2e` получает статус **failure**, весь запуск тоже.
- Пропущены шаги `Post Cache Playwright browsers` и `Post Run actions/setup-node@v4`. Кэш Chromium не сохранён.

Статусы шагов, вывод `gh run view 41614491572`:

```
X e2e in 1m30s (ID 125844748611)
  ✓ Set up job
  ✓ Run actions/checkout@v4
  ✓ Run actions/setup-node@v4
  ✓ Install dependencies
  - Skip e2e without a stand
  ✓ Cache Playwright browsers
  ✓ Install Playwright Browsers
  ✓ Run Playwright tests
  ✓ Run actions/upload-artifact@v4
  X Test summary
  - Post Cache Playwright browsers
  - Post Run actions/setup-node@v4
  ✓ Post Run actions/checkout@v4
  ✓ Complete job
```

## Лог дефекта

Ниже полный лог шага `Test summary` без сокращений. Секреты GitHub замаскировал как `***`. Нумерация строк — как в UI шага (L1–L56) и в полном логе джобы (498–553).

```
L1   2026-11-03T09:54:21.6914221Z ##[group]Run node -e '
L2   2026-11-03T09:54:21.6914567Z node -e '
L3   2026-11-03T09:54:21.6914988Z   if (!fs.existsSync(p)) { console.log("::warning::No results.json produced"); process.exit(0); }
L4   2026-11-03T09:54:21.6915483Z   const r = JSON.parse(fs.readFileSync(p, "utf8"));
L5   2026-11-03T09:54:21.6915830Z   const stats = r.stats || {};
L6   2026-11-03T09:54:21.6916144Z   const lines = [];
L7   2026-11-03T09:54:21.6916460Z   lines.push("## Playwright summary");
L8   2026-11-03T09:54:21.6916749Z   lines.push("");
L9   2026-11-03T09:54:21.6917100Z   lines.push(`- **Passed:** ${stats.passed ?? 0}`);
L10  2026-11-03T09:54:21.6917481Z   lines.push(`- **Failed:** ${stats.failed ?? 0}`);
L11  2026-11-03T09:54:21.6917842Z   lines.push(`- **Flaky:** ${stats.flaky ?? 0}`);
L12  2026-11-03T09:54:21.6918218Z   lines.push(`- **Skipped:** ${stats.skipped ?? 0}`);
L13  2026-11-03T09:54:21.6918667Z   lines.push(`- **Duration:** ${((stats.duration ?? 0) / 1000).toFixed(1)}s`);
L14  2026-11-03T09:54:21.6919181Z   const failed = (r.suites || []).flatMap(collectFailed);
L15  2026-11-03T09:54:21.6919789Z   if (failed.length) {
L16  2026-11-03T09:54:21.6920074Z     lines.push("");
L17  2026-11-03T09:54:21.6920395Z     lines.push("### Failed tests");
L18  2026-11-03T09:54:21.6920698Z     lines.push("");
L19  2026-11-03T09:54:21.6921034Z     failed.forEach(f => lines.push(`- ${f}`));
L20  2026-11-03T09:54:21.6921354Z   }
L21  2026-11-03T09:54:21.6921694Z   fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
L22  2026-11-03T09:54:21.6922292Z   function collectFailed(suite) {
L23  2026-11-03T09:54:21.6922609Z     const out = [];
L24  2026-11-03T09:54:21.6922910Z     for (const spec of suite.specs || []) {
L25  2026-11-03T09:54:21.6923245Z       for (const t of spec.tests || []) {
L26  2026-11-03T09:54:21.6923656Z         const err = (t.results || []).find(res => res.status === "failed");
L27  2026-11-03T09:54:21.6924090Z         if (err) out.push(`${spec.file || ""}: ${t.title}`);
L28  2026-11-03T09:54:21.6924437Z       }
L29  2026-11-03T09:54:21.6924670Z     }
L30  2026-11-03T09:54:21.6925046Z     for (const child of suite.suites || []) out.push(...collectFailed(child));
L31  2026-11-03T09:54:21.6925442Z     return out;
L32  2026-11-03T09:54:21.6925682Z   }
L33  2026-11-03T09:54:21.6925944Z '
L34  2026-11-03T09:54:21.6951858Z shell: /usr/bin/bash -e {0}
L35  2026-11-03T09:54:21.6952162Z env:
L36  2026-11-03T09:54:21.6952702Z   SESSION_URL: ***
L37  2026-11-03T09:54:21.6952980Z   ADMIN_URL: 
L38  2026-11-03T09:54:21.6953282Z   ADMIN_EMAIL: ***
L39  2026-11-03T09:54:21.6953570Z   ADMIN_PASSWORD: ***
L40  2026-11-03T09:54:21.6953844Z ##[endgroup]
L41  2026-11-03T09:54:21.7199933Z [eval]:2
L42  2026-11-03T09:54:21.7200902Z   if (!fs.existsSync(p)) { console.log("::warning::No results.json produced"); process.exit(0); }
L43  2026-11-03T09:54:21.7201750Z                      ^
L44  2026-11-03T09:54:21.7202235Z 
L45  2026-11-03T09:54:21.7202564Z ReferenceError: p is not defined
L46  2026-11-03T09:54:21.7203007Z     at [eval]:2:22
L47  2026-11-03T09:54:21.7203492Z     at runScriptInThisContext (node:internal/vm:219:10)
L48  2026-11-03T09:54:21.7204070Z     at node:internal/process/execution:485:12
L49  2026-11-03T09:54:21.7204562Z     at [eval]-wrapper:6:24
L50  2026-11-03T09:54:21.7205036Z     at runScriptInContext (node:internal/process/execution:483:60)
L51  2026-11-03T09:54:21.7205548Z     at evalFunction (node:internal/process/execution:317:30)
L52  2026-11-03T09:54:21.7206044Z     at evalTypeScript (node:internal/process/execution:329:3)
L53  2026-11-03T09:54:21.7206469Z     at node:internal/main/eval_string:71:3
L54  2026-11-03T09:54:21.7206746Z 
L55  2026-11-03T09:54:21.7206918Z Node.js v26.13.0
L56  2026-11-03T09:54:21.7225933Z ##[error]Process completed with exit code 1.
```

Ключевые строки:
- **L45** — `ReferenceError: p is not defined`, позиция `[eval]:2:22`. Это первое обращение к `p` в `fs.existsSync(p)`.
- **L56** — итог шага, `exit code 1`.

Предшествующий шаг `Run Playwright tests` подтверждает, что тесты прошли (строки 462–464 полного лога):

```
2026-11-03T09:53:50.5870882Z Running 7 tests using 1 worker
2026-11-03T09:54:20.7262846Z ·······
2026-11-03T09:54:20.7265419Z   7 passed (30.3s)
```

## Причина

В коммите `063c6a5` из inline-скрипта `node -e` шага `Test summary` удалены две строки объявлений:

```diff
       run: |
         node -e '
-          const fs = require("fs");
-          const p = "test-results/results.json";
           if (!fs.existsSync(p)) { console.log("::warning::No results.json produced"); process.exit(0); }
```

- `fs` в режиме `node -e` доступен как глобальная переменная (встроенные модули Node), поэтому его удаление на работу не повлияло.
- `p` — путь к JSON-отчёту Playwright (`playwright.config.ts:18`, `outputFile: 'test-results/results.json'`). Больше нигде не объявлен. Первая строка скрипта бросает `ReferenceError`, `node` выходит с кодом 1, а `bash -e` завершает шаг ошибкой.

Категория: **ошибка конфигурации пайплайна**.
- Не тест: `7 passed`.
- Не окружение: дефект детерминированный, повторяется на любом раннере и любой версии Node.

## Предлагаемое исправление

Вернуть удалённые объявления в начало скрипта, в `.github/workflows/playwright.yml` после строки 80 `node -e '`:

```diff
           node -e '
+            const fs = require("fs");
+            const p = "test-results/results.json";
             if (!fs.existsSync(p)) { console.log("::warning::No results.json produced"); process.exit(0); }
```

## Критерии приёмки

1. Ручной запуск `Playwright Tests` на ветке с исправлением и заданными секретами: шаг `Test summary` завершается с кодом 0, в логе нет `ReferenceError`.
2. Джоба `e2e` и запуск зелёные, если `Run Playwright tests` зелёный.
3. В Summary запуска есть блок «Playwright summary».
4. Выполнен шаг `Post Cache Playwright browsers`, в логе есть `Cache saved`.

## Вложения

- Полный лог джобы `e2e` (569 строк, без ANSI-кодов, секреты замаскированы GitHub): [`logs/run-41614491572-job-e2e.log`](logs/run-41614491572-job-e2e.log).
- Артефакт запуска: [`playwright-report`](https://github.com/AnnaMark90/AI-training-repo/actions/runs/41614491572/artifacts/13220976808) (HTML-отчёт и `results.json`).
