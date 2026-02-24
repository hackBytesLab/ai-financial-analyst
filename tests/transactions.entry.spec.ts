import { expect, test } from '@playwright/test';

test('create transaction from entry form and show success feedback', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /ไม่มีบัญชี|ลงทะเบียน|sign up|create account/i }).click();

  const unique = Date.now();
  const email = `autotx+${unique}@example.com`;
  const password = 'Test123456';

  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('input[type="password"]').nth(1).fill(password);
  await page.getByRole('button', { name: /สร้างบัญชี|sign up|create account/i }).click();

  await expect(page.getByText(/dashboard|เงินคงเหลือสุทธิ|income vs expenses/i).first()).toBeVisible();

  await page.getByRole('link', { name: /บันทึกข้อมูล/i }).first().click();
  await expect(page.getByRole('heading', { name: /บันทึกข้อมูลการเงิน/i })).toBeVisible();

  await page.locator('input[placeholder="0.00"]').fill('1234');
  await page.locator('select').first().selectOption({ index: 1 });
  await page.getByRole('button', { name: /บันทึกรายการ/i }).click();

  await expect(page.getByText(/บันทึกรายการสำเร็จแล้ว/i)).toBeVisible();
});
