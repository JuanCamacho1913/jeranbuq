import { test as base, type Page } from '@playwright/test';

type AuthFixtures = {
  clientPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  clientPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    // Call the test session endpoint to set auth cookie on the context
    await ctx.request.get('/api/test/session?role=CLIENT');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    // Call the test session endpoint to set auth cookie on the context
    await ctx.request.get('/api/test/session?role=ADMIN');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
