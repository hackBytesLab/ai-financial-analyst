import { expect, test } from '@playwright/test';

test('login and logout flow works', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /ไม่มีบัญชี|ลงทะเบียน|sign up|create account/i }).click();

  const unique = Date.now();
  const email = `autotest+${unique}@example.com`;
  const password = 'Test123456';

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('input[type="password"]').nth(1).fill(password);
  await page.getByRole('button', { name: /สร้างบัญชี|sign up|create account/i }).click();

  await expect(page.getByText(/dashboard|เงินคงเหลือสุทธิ|income vs expenses/i).first()).toBeVisible();

  await page.locator('button[title="ออกจากระบบ"]').click();
  await expect(page.getByRole('heading', { name: /เข้าสู่ระบบ/i })).toBeVisible();

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole('button', { name: /^เข้าสู่ระบบ$/i }).click();

  await expect(page.getByText(/dashboard|เงินคงเหลือสุทธิ|income vs expenses/i).first()).toBeVisible();
});
