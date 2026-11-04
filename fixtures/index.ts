import { test as base, expect } from '@playwright/test';
import { ADMIN_STORAGE_STATE } from '../config/env';
import { Customer } from '../data/customer';
import { AdminApi } from '../helpers/api/admin-api';
import { AuthHelper } from '../helpers/auth.helper';
import { loadCustomer } from '../helpers/customer.helper';
import { LoginPage } from '../pages/login/login.page';
import { AccountOverviewPage } from '../pages/account/overview.page';
import { AdminLoginPage } from '../pages/admin/admin-login.page';
import { AdminOrdersPage } from '../pages/admin/admin-orders.page';
import { StorePage } from '../pages/store/store.page';
import { ProductPage } from '../pages/store/product.page';

type AuthFixtures = {
  authHelper: AuthHelper;
  loginPage: LoginPage;
  accountPage: AccountOverviewPage;
  adminLoginPage: AdminLoginPage;
  adminOrdersPage: AdminOrdersPage;
  storePage: StorePage;
  productPage: ProductPage;
  /** Admin API client with the admin session: works in any project, whoever is logged in the browser. */
  adminApi: AdminApi;
  /** Customer registered by the setup project on your stand. */
  customer: Customer;
};

export const test = base.extend<AuthFixtures>({
  authHelper: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountOverviewPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  adminOrdersPage: async ({ page }, use) => {
    await use(new AdminOrdersPage(page));
  },
  storePage: async ({ page }, use) => {
    await use(new StorePage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  adminApi: async ({ playwright, baseURL }, use) => {
    const request = await playwright.request.newContext({ baseURL, storageState: ADMIN_STORAGE_STATE });
    await use(new AdminApi(request));
    await request.dispose();
  },
  // eslint-disable-next-line no-empty-pattern
  customer: async ({}, use) => {
    await use(loadCustomer());
  },
});

export { expect };
