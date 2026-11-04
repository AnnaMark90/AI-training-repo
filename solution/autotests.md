# Автотесты TC-03: выбор варианта

Файл: `tests/store/product-variant.spec.ts`, `test.describe('Product variant')`. Роль: гость (`SESSION_STORAGE_STATE`). Товар: Medusa T-Shirt `/dk/products/t-shirt`.

## Соответствие требованиям

| Что внутри                                                                                                  | Обязательное требование                                                                                           | Статус                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Позитивный автотест** `TC-03: Add to cart is enabled only after Black / M is selected, price is €10`      | Сценарий из мануального кейса. Запущен в песочнице и прошёл; стиль как в примере теста                            | ✅ Шаги TC-03, проверки RC-13 и RC-14. Прошёл на стенде (весь набор, 2 прогона подряд, `--repeat-each=5`). Стиль `tests/store/catalog.spec.ts` |
| **Граничный/негативный автотест** `TC-03-NEG: Add to cart stays disabled when only Color Black is selected` | Один доп. случай из плана или data-driven вариант. Запущен в песочнице; проверка срабатывает на невалидных данных | ✅ Доп. случай №1 из `plan.md` (P0). Прошёл на стенде. На невалидных данных падает (мутации 1–2 в `verify.md`)                                 |

## Позитивный автотест

| #   | Шаг                                       | Ассерт                                                                                                                    | Данные       |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | `productPage.goto(PRODUCT.handle)`        | `title` `toHaveText('Medusa T-Shirt')`                                                                                    | `t-shirt`    |
| 2   | Ничего не выбирать (RC-13)                | `addToCartButton` `toBeDisabled()`, `toHaveText('Select variant')`; `priceLabel` `toHaveText('From €10.00')`              | —            |
| 3   | `productPage.selectVariant('Black', 'M')` | —                                                                                                                         | `Black`, `M` |
| 4   | Проверить результат (RC-14)               | `addToCartButton` `toBeEnabled()`, `toHaveText('Add to cart')`; `priceLabel` `toHaveText('€10.00')` — префикса `From` нет | `€10.00`     |

## Негативный автотест

| #   | Шаг                                               | Ассерт                                                                                                       | Данные                     |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 1   | `productPage.goto(PRODUCT.handle)`                | `title` `toHaveText('Medusa T-Shirt')`                                                                       | `t-shirt`                  |
| 2   | `productPage.selectVariant('Black')`              | `addToCartButton` `toBeDisabled()`, `toHaveText('Select variant')`; `priceLabel` `toHaveText('From €10.00')` | `Black` — неполный вариант |
| 3   | Контрольный шаг: `productPage.selectVariant('M')` | `addToCartButton` `toBeEnabled()`                                                                            | `M`                        |

Шаг 3 доказывает, что клик по Black применился: без него шаг 2 прошёл бы и при потерянном клике, потому что кнопка выключена ещё до выбора.

## Стиль

- Как в `tests/store/catalog.spec.ts`: `test.describe`, гость через `test.use({ storageState: SESSION_STORAGE_STATE })`, Page Object из фикстуры, название `ID: что ожидается`.
- Только web-first ассерты, без `waitForTimeout`; селекторов в тестах нет, навигация через `goto()` Page Object.
- Тестовые данные в константах `PRODUCT` и `VARIANT`.

## Файлы

| Файл                                  | Что сделано                                             |
| ------------------------------------- | ------------------------------------------------------- |
| `tests/store/product-variant.spec.ts` | Создан: оба теста                                       |
| `pages/store/product.page.ts`         | Добавлен локатор `priceLabel` (цена с префиксом `From`) |
| `fixtures/index.ts`                   | Добавлена фикстура `productPage`                        |

Импорты спека: `test`, `expect` из `../../fixtures`; `SESSION_STORAGE_STATE` из `../../config/env`.

## Не покрыто

- RC-11 (галерея): на стенде нет переключения изображений.
- `priceLabel` построен без `data-testid` (у обёртки его нет) — запрос к разработке описан в `verify.md`.
