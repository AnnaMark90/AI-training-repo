import { Page, Locator } from "@playwright/test";

/** Product details page: /dk/products/<handle>. Related products below it are out of scope. */
export class ProductPage {
  readonly page: Page;
  readonly container: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly price: Locator;
  /** Price with its "From " prefix, which is shown until a variant is resolved. */
  readonly priceLabel: Locator;
  readonly images: Locator;
  readonly optionButtons: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("product-container");
    this.title = this.container.getByTestId("product-title");
    this.description = this.container.getByTestId("product-description");
    this.price = this.container.getByTestId("product-price");
    // The wrapper has no data-testid: anchor it to the price inside.
    this.priceLabel = this.container
      .locator("span")
      .filter({ has: page.getByTestId("product-price") });
    this.images = this.container.getByRole("img");
    this.optionButtons = this.container
      .getByTestId("product-options")
      .getByTestId("option-button");
    this.addToCartButton = this.container.getByTestId("add-product-button");
  }

  async goto(handle: string) {
    await this.page.goto(`/dk/products/${handle}`);
  }

  async waitForLoaded() {
    await this.title.waitFor();
  }

  /** Option value button, e.g. 'M' or 'Black'. Exact match: 'L' must not hit 'XL'. */
  optionButton(value: string): Locator {
    return this.optionButtons.getByText(value, { exact: true });
  }

  /** Selects one value per option, e.g. selectVariant('Black', 'M'). */
  async selectVariant(...values: string[]) {
    for (const value of values) {
      await this.optionButton(value).click();
    }
  }
}
