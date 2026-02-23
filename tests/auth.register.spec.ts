import { expect, test } from '@playwright/test';

test('register flow reaches authenticated area', async ({ page }) => {
  await page.goto('/');

  const registerSwitch = page.getByRole('button', { name: /ลงทะเบียน|ไม่มีบัญชี|create account|sign up/i });
  if (await registerSwitch.isVisible()) {
    await registerSwitch.click();
  }

  await expect(page.getByRole('heading', { name: /สร้างบัญชี/i })).toBeVisible();

  const unique = Date.now();
  await page.locator('input[type="email"]').first().fill(`autotest+${unique}@example.com`);
  await page.locator('input[type="password"]').first().fill('Test123456');
  await page.locator('input[type="password"]').nth(1).fill('Test123456');

  await page.getByRole('button', { name: /สร้างบัญชี|create account|sign up/i }).click();

  await expect(
    page.getByText(/dashboard|เงินคงเหลือสุทธิ|income vs expenses/i).first(),
  ).toBeVisible({ timeout: 20_000 });
});
