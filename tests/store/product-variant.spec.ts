import { test, expect } from "../../fixtures";
import { SESSION_STORAGE_STATE } from "../../config/env";

const PRODUCT = { handle: "t-shirt", title: "Medusa T-Shirt" };
const VARIANT = { color: "Black", size: "M", price: "€10.00" };

test.describe("Product variant", () => {
  // The storefront is browsed by a guest
  test.use({ storageState: SESSION_STORAGE_STATE });

  test("TC-03: Add to cart is enabled only after Black / M is selected, price is €10", async ({
    productPage,
  }) => {
    await productPage.goto(PRODUCT.handle);
    await expect(productPage.title).toHaveText(PRODUCT.title);

    // RC-13: no variant selected -> the button is locked because of the selection, not stock.
    await expect(productPage.addToCartButton).toBeDisabled();
    await expect(productPage.addToCartButton).toHaveText("Select variant");
    await expect(productPage.priceLabel).toHaveText(`From ${VARIANT.price}`);

    await productPage.selectVariant(VARIANT.color, VARIANT.size);

    // RC-14: a concrete variant is resolved -> it can be added at its price.
    await expect(productPage.addToCartButton).toBeEnabled();
    await expect(productPage.addToCartButton).toHaveText("Add to cart");
    // All variants cost the same: only the dropped "From" proves a variant price is shown.
    await expect(productPage.priceLabel).toHaveText(VARIANT.price);
  });

  test("TC-03-NEG: Add to cart stays disabled when only Color Black is selected", async ({
    productPage,
  }) => {
    await productPage.goto(PRODUCT.handle);
    await expect(productPage.title).toHaveText(PRODUCT.title);

    await productPage.selectVariant(VARIANT.color);

    // Color without Size does not resolve a variant.
    await expect(productPage.addToCartButton).toBeDisabled();
    await expect(productPage.addToCartButton).toHaveText("Select variant");
    await expect(productPage.priceLabel).toHaveText(`From ${VARIANT.price}`);

    // Control step: Black was really applied, otherwise M alone could not unlock the button.
    // Without it the checks above would also pass if the click were lost.
    await productPage.selectVariant(VARIANT.size);
    await expect(productPage.addToCartButton).toBeEnabled();
  });
});
